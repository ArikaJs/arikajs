import * as fs from 'fs';
import * as path from 'path';
import { Container, Token, Factory } from '../container/Container';
import { ServiceProvider } from '../providers/ServiceProvider';
import { Repository, EnvLoader, setConfigRepository } from '@arikajs/config';

/**
 * Application is the core runtime of ArikaJS.
 *
 * It manages:
 * - Service container
 * - Service providers
 * - Configuration
 * - Application lifecycle (register → boot → run)
 */
export class Application {
  private readonly container: Container;
  private readonly basePath: string;
  private readonly configRepository: Repository;
  private providers: ServiceProvider[] = [];
  private booted = false;
  private static instance: Application | null = null;
  private terminatingCallbacks: (() => void | Promise<void>)[] = [];

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    this.container = new Container();
    this.configRepository = new Repository();

    Application.instance = this;

    // Register the config repository in the global support helper
    setConfigRepository(this.configRepository);

    // Register the application, container, and config for injection
    this.container.instance(Application, this);
    this.container.instance(Container, this.container);
    this.container.instance(Repository, this.configRepository);

    // Load environment variables from .env if it exists
    EnvLoader.load(this.basePath);

    // Load configuration
    const cachedConfigPath = path.join(this.basePath, 'bootstrap', 'cache', 'config.json');

    if (fs.existsSync(cachedConfigPath)) {
      try {
        const cachedData = fs.readFileSync(cachedConfigPath, 'utf8');
        this.configRepository = new Repository(JSON.parse(cachedData));
      } catch (e) {
        console.error('Failed to load cached config, falling back to directory loading...', e);
        const configPath = path.join(this.basePath, 'config');
        this.configRepository.loadConfigDirectory(configPath);
      }
    } else {
      const configPath = path.join(this.basePath, 'config');
      this.configRepository.loadConfigDirectory(configPath);
    }

    // Apply timezone from config to the Node.js process
    const timezone = this.configRepository.get<string>('app.timezone');
    if (timezone) {
      process.env.TZ = timezone;
    }
  }

  /**
   * Get the globally available application instance.
   */
  public static getInstance(): Application {
    if (!this.instance) {
      throw new Error('Application instance has not been created yet.');
    }
    return this.instance;
  }

  /**
   * Get the base path of the application.
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Access the underlying container.
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Access the configuration repository.
   */
  config(): Repository {
    return this.configRepository;
  }

  /**
   * Alias for make() - resolves a service from the container.
   */
  make<T>(token: Token<T>): T {
    // Check the container first — explicit bindings always win
    if (this.container.has(token)) {
      return this.container.make(token);
    }

    // If it's a config token (e.g. 'config.app.name'),
    // fall back to the configuration repository
    if (typeof token === 'string' && token.startsWith('config.')) {
      const configKey = token.substring(7);
      const value = this.configRepository.get(configKey);

      if (value !== undefined) {
        return value as T;
      }
    }

    // Final attempt — let the container throw if not found
    return this.container.make(token);
  }

  /**
   * Bind a transient service.
   */
  bind<T>(token: Token<T>, factory: Factory<T>): void {
    this.container.bind(token, factory);
  }

  /**
   * Bind a singleton service.
   */
  singleton<T>(token: Token<T>, factory: Factory<T>): void {
    this.container.singleton(token, factory);
  }

  /**
   * Register an existing instance.
   */
  instance<T>(token: Token<T>, value: T): void {
    this.container.instance(token, value);
  }

  /**
   * Register an alias for a token.
   */
  alias(token: Token, alias: Token): void {
    this.container.alias(token, alias);
  }

  /**
   * Tag a token.
   */
  tag(token: Token, tag: string): void {
    this.container.tag(token, tag);
  }

  /**
   * Resolve all tagged services.
   */
  tagged<T = any>(tag: string): T[] {
    return this.container.tagged<T>(tag);
  }

  /**
   * Extend a service.
   */
  extend<T = any>(token: Token<T>, callback: (instance: T) => T): void {
    this.container.extend(token, callback);
  }

  /**
   * Register a service provider.
   * Can accept a class (will be instantiated) or an instance.
   */
  register(
    provider:
      | ServiceProvider
      | (new (app: Application) => ServiceProvider),
  ): void {
    if (this.booted) {
      throw new Error(
        'Cannot register providers after the application has been booted.',
      );
    }

    const providerInstance =
      provider instanceof ServiceProvider
        ? provider
        : new provider(this);

    this.providers.push(providerInstance);
  }

  /**
   * Boot all registered service providers.
   * First runs all register() methods, then all boot() methods.
   */
  async boot(): Promise<void> {
    if (this.booted) {
      return;
    }

    // Phase 1: Register all providers
    for (const provider of this.providers) {
      await provider.register();
    }

    // Phase 2: Boot all providers
    for (const provider of this.providers) {
      await provider.boot();
    }

    // Phase 3: Apply runtime configuration

    // Re-apply timezone in case it was changed after construction
    const timezone = this.configRepository.get<string>('app.timezone');
    if (timezone) {
      process.env.TZ = timezone;
    }

    // Validate APP_KEY (unless in debug/local mode)
    if (!this.configRepository.get('app.key') && process.env.NODE_ENV === 'production') {
      throw new Error('Application key (APP_KEY) is not set. Please run "arika key:generate" to generate one.');
    }

    // Mark config as booted (read-only)
    this.configRepository.markAsBooted();

    this.booted = true;
  }

  /**
   * Run the application.
   */
  async run(): Promise<void> {
    if (!this.booted) {
      await this.boot();
    }
  }

  /**
   * Gracefully terminate the application.
   */
  async terminate(): Promise<void> {
    for (const callback of this.terminatingCallbacks) {
      await callback();
    }
  }

  /**
   * Register a callback to be run when the application is terminating.
   */
  onTerminate(callback: () => void | Promise<void>): void {
    this.terminatingCallbacks.push(callback);
  }

  /**
   * Alias for make() - resolves a service from the container.
   */
  resolve<T>(token: Token<T>): T {
    return this.make(token);
  }

  /**
   * Check if a service is registered in the container.
   */
  has(token: Token): boolean {
    return this.container.has(token);
  }

  /**
   * Check if the application has been booted.
   */
  isBooted(): boolean {
    return this.booted;
  }
}
