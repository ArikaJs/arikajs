import { Container } from './Contracts/Container';
import { MiddlewareHandler, Middleware } from './Middleware';
import { Log } from '@arikajs/logging';

/**
 * Pipeline executes a stack of middleware in an onion-style model.
 */
export class Pipeline<TRequest = any, TResponse = any> {
    /**
     * The stack of middleware handlers.
     */
    private handlers: MiddlewareHandler<TRequest, TResponse>[] = [];
    private middlewareGroups: Record<string, any[]> = {};
    private aliases: Record<string, any> = {};

    private static isClassCache = new WeakMap<Function, boolean>();

    /**
     * Create a new Pipeline instance.
     */
    constructor(private readonly container?: Container) { }

    /**
     * Set the middleware groups.
     */
    public setMiddlewareGroups(groups: Record<string, any[]>): this {
        this.middlewareGroups = groups;
        return this;
    }

    /**
     * Set the middleware aliases.
     */
    public setAliases(aliases: Record<string, any>): this {
        this.aliases = aliases;
        return this;
    }

    /**
     * Cache for flattened handlers.
     */
    private flattenedCache: any[] | null = null;

    /**
     * Cache for parsed handler metadata (name and args).
     */
    private static parsedHandlerCache = new Map<string, { handler: any, args: any[] }>();

    /**
     * Add middleware to the pipeline.
     */
    public pipe(middleware: MiddlewareHandler<TRequest, TResponse> | MiddlewareHandler<TRequest, TResponse>[]): this {
        if (Array.isArray(middleware)) {
            if (middleware.length > 0) {
                this.handlers.push(...middleware);
                this.flattenedCache = null; // Invalidate cache
            }
        } else {
            this.handlers.push(middleware);
            this.flattenedCache = null; // Invalidate cache
        }
        return this;
    }

    /**
     * Run the pipeline through the given destination.
     */
    public handle(
        request: TRequest,
        destination: (request: TRequest, response?: TResponse) => Promise<TResponse> | TResponse,
        response?: TResponse
    ): Promise<TResponse> | TResponse {
        if (!this.flattenedCache) {
            this.flattenedCache = this.flattenHandlers(this.handlers);
        }

        const flattened = this.flattenedCache;

        const invoke = (index: number, req: TRequest): Promise<TResponse> | TResponse => {
            if (index >= flattened.length) {
                return destination(req, response);
            }

            const current = flattened[index];
            const metadata = this.getHandlerMetadata(current);
            const handler = this.resolve(metadata.handler);

            let result: any;
            if (typeof handler === 'function') {
                result = handler(req, (nextReq: TRequest) => invoke(index + 1, nextReq), response, ...metadata.args);
            } else if (typeof handler === 'object' && 'handle' in handler && typeof handler.handle === 'function') {
                result = (handler as any).handle(req, (nextReq: TRequest) => invoke(index + 1, nextReq), response, ...metadata.args);
            } else {
                throw new Error(`Invalid middleware handler: ${typeof handler}`);
            }

            // Sync-first: If result is a promise, we must return a promise
            if (result instanceof Promise) {
                return result;
            }

            return result;
        };

        return invoke(0, request);
    }

    /**
     * Helper to get or parse handler metadata.
     */
    private getHandlerMetadata(handler: any): { handler: any, args: any[] } {
        if (typeof handler !== 'string') {
            return { handler, args: [] };
        }

        let metadata = Pipeline.parsedHandlerCache.get(handler);
        if (!metadata) {
            metadata = this.parseHandler(handler);
            Pipeline.parsedHandlerCache.set(handler, metadata);
        }
        return metadata;
    }

    /**
     * Cache for resolved middleware instances.
     */
    private resolvedInstances = new Map<any, any>();

    /**
     * Resolve the middleware handler.
     */
    private resolve(handler: any): any {
        // If it's a string, try resolving from aliases first, then container
        if (typeof handler === 'string') {
            const alias = this.aliases[handler];
            if (alias) {
                return this.resolve(alias);
            }
            if (this.container && this.container.has(handler)) {
                // For string keys, check if we've already resolved an instance
                if (this.resolvedInstances.has(handler)) {
                    return this.resolvedInstances.get(handler);
                }
                const resolved = this.container.make(handler);
                // If it's an object (instance), we'll cache it
                if (typeof resolved === 'object' && resolved !== null) {
                    this.resolvedInstances.set(handler, resolved);
                }
                return resolved;
            }
            return handler;
        }

        // If it's a class/constructor (has handle on prototype), instantiate it
        if (typeof handler === 'function') {
            let isClass = Pipeline.isClassCache.get(handler);

            if (isClass === undefined) {
                const source = handler.toString();
                isClass = !!(/^\s*class\s+/.test(source) || (handler.prototype && typeof handler.prototype.handle === 'function'));
                Pipeline.isClassCache.set(handler, isClass);
            }

            if (isClass) {
                // CHECK CACHE: If we've already resolved this class once, return the instance.
                if (this.resolvedInstances.has(handler)) {
                    return this.resolvedInstances.get(handler);
                }

                // If it's a class and we have a container, we MUST check if it's a singleton or resolve a fresh one
                const resolved = this.container ? this.container.make(handler) : new (handler as any)();
                
                // We cache the instance to avoid re-instantiation on subsequent requests
                this.resolvedInstances.set(handler, resolved);
                
                return resolved;
            }
        }

        return handler;
    }

    /**
     * Flatten handlers by resolving groups and aliases.
     */
    private flattenHandlers(handlers: any[]): any[] {
        let flattened: any[] = [];

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (typeof handler === 'string') {
                const colonIndex = handler.indexOf(':');
                const name = colonIndex === -1 ? handler : handler.slice(0, colonIndex);
                const args = colonIndex === -1 ? null : handler.slice(colonIndex + 1);

                if (this.middlewareGroups[name]) {
                    flattened.push(...this.flattenHandlers(this.middlewareGroups[name]));
                    continue;
                }

                if (this.aliases[name]) {
                    const resolved = this.aliases[name];
                    if (args) {
                        flattened.push(handler);
                    } else if (Array.isArray(resolved)) {
                        flattened.push(...this.flattenHandlers(resolved));
                    } else {
                        flattened.push(...this.flattenHandlers([resolved]));
                    }
                    continue;
                }
            }

            flattened.push(handler);
        }

        return flattened;
    }

    /**
     * Parse handler string to extract arguments.
     */
    private parseHandler(handler: string): { handler: any, args: any[] } {
        const colonIndex = handler.indexOf(':');
        if (colonIndex === -1) {
            return { handler, args: [] };
        }

        const name = handler.slice(0, colonIndex);
        const argsStr = handler.slice(colonIndex + 1);
        
        return {
            handler: name,
            args: argsStr.includes(',') ? argsStr.split(',') : [argsStr]
        };
    }
}
