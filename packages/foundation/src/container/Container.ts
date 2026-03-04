export type Token<T = any> = string | symbol | (new (...args: any[]) => T);

export type Factory<T = any> = (container: Container) => T;

interface Binding<T = any> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * Lightweight dependency injection container for ArikaJS.
 *
 * Responsible for:
 * - Registering bindings and singletons
 * - Resolving services on demand
 * - Holding pre-built instances
 */
export class Container {
  private bindings = new Map<Token, Binding>();
  private aliases = new Map<Token, Token>();
  private tags = new Map<string, Token[]>();
  private extenders = new Map<Token, ((instance: any) => any)[]>();

  /**
   * Bind a token to a factory. Produces a new instance on every resolution.
   */
  bind<T>(token: Token<T>, factory: Factory<T>): void {
    this.bindings.set(token, { factory, singleton: false });
  }

  /**
   * Bind a token as a singleton. The factory runs once and the
   * same instance is returned for all subsequent resolutions.
   */
  singleton<T>(token: Token<T>, factory: Factory<T>): void {
    this.bindings.set(token, { factory, singleton: true });
  }

  /**
   * Directly register an existing instance for a token.
   */
  instance<T>(token: Token<T>, value: T): void {
    this.bindings.set(token, {
      factory: () => value,
      singleton: true,
      instance: value,
    });
  }

  /**
   * Create an alias for a token.
   */
  alias(token: Token, alias: Token): void {
    this.aliases.set(alias, token);
  }

  /**
   * Assign a tag to a given token.
   */
  tag(token: Token, tag: string): void {
    if (!this.tags.has(tag)) {
      this.tags.set(tag, []);
    }
    this.tags.get(tag)?.push(token);
  }

  /**
   * Resolve all bindings associated with a given tag.
   */
  tagged<T = any>(tag: string): T[] {
    const tokens = this.tags.get(tag) || [];
    return tokens.map(token => this.make<T>(token));
  }

  /**
   * Extend a binding in the container.
   */
  extend<T = any>(token: Token<T>, callback: (instance: T) => T): void {
    const originalToken = this.getAlias(token);
    if (!this.extenders.has(originalToken)) {
      this.extenders.set(originalToken, []);
    }
    this.extenders.get(originalToken)?.push(callback);
  }

  /**
   * Resolve a token from the container.
   */
  make<T>(token: Token<T>): T {
    const originalToken = this.getAlias(token);
    let binding = this.bindings.get(originalToken);

    if (!binding) {
      if (typeof originalToken === 'function') {
        return this.instantiate(originalToken as any);
      }
      throw new Error(`Container: no binding found for token "${String(token)}"`);
    }

    let instance: T;
    if (binding.singleton) {
      if (binding.instance === undefined) {
        binding.instance = binding.factory(this);
        binding.instance = this.applyExtenders(originalToken, binding.instance);
      }
      instance = binding.instance as T;
    } else {
      instance = binding.factory(this);
      instance = this.applyExtenders(originalToken, instance);
    }

    return instance;
  }

  private getAlias(token: Token): Token {
    return this.aliases.get(token) || token;
  }

  private applyExtenders(token: Token, instance: any): any {
    const extenders = this.extenders.get(token) || [];
    return extenders.reduce((inst, extender) => extender(inst), instance);
  }

  private instantiate(constructor: new (...args: any[]) => any): any {
    // Basic automatic injection (assumes constructor only takes container)
    // In the future, this will use Reflect metadata for property/param injection
    return new constructor(this);
  }

  /**
   * Alias for make() - resolves a token from the container.
   */
  resolve<T>(token: Token<T>): T {
    return this.make(token);
  }

  /**
   * Check whether a token has been registered.
   */
  has(token: Token): boolean {
    return this.bindings.has(this.getAlias(token));
  }
}
