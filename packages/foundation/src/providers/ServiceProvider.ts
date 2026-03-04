import { Application } from '../contracts/Application';

/**
 * Base class for service providers in ArikaJS.
 *
 * Service providers are the primary way to package and register features.
 * They follow a two-phase lifecycle:
 * - register(): Bind services to the container (no heavy side-effects)
 * - boot(): Perform runtime logic after all providers are registered
 */
export abstract class ServiceProvider<T extends Application = Application> {
  constructor(protected readonly app: T) { }

  /**
   * Register services to the container.
   * This method is called for all providers before any boot() methods run.
   */
  abstract register(): void | Promise<void>;

  /**
   * Boot the service provider.
   * This method is called after all providers have been registered.
   * Safe to resolve other services here.
   */
  boot(): void | Promise<void> {
    // Optional to override
  }
}
