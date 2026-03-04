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
     * Add middleware to the pipeline.
     */
    public pipe(middleware: MiddlewareHandler<TRequest, TResponse> | MiddlewareHandler<TRequest, TResponse>[]): this {
        if (Array.isArray(middleware)) {
            this.handlers.push(...middleware);
        } else {
            this.handlers.push(middleware);
        }
        return this;
    }

    /**
     * Run the pipeline through the given destination.
     */
    public async handle(
        request: TRequest,
        destination: (request: TRequest, response?: TResponse) => Promise<TResponse> | TResponse,
        response?: TResponse
    ): Promise<TResponse> {
        const flattened = this.flattenHandlers(this.handlers);

        const invoke = async (index: number, req: TRequest): Promise<TResponse> => {
            if (index >= flattened.length) {
                return destination(req, response);
            }

            const { handler: rawHandler, args } = this.parseHandler(flattened[index]);
            const handler = this.resolve(rawHandler);

            if (typeof handler === 'function') {
                return handler(req, (nextReq: TRequest) => invoke(index + 1, nextReq), response, ...args);
            }

            if (typeof handler === 'object' && 'handle' in handler && typeof handler.handle === 'function') {
                return (handler as any).handle(req, (nextReq: TRequest) => invoke(index + 1, nextReq), response, ...args);
            }

            throw new Error(`Invalid middleware handler: ${typeof handler}`);
        };

        return invoke(0, request);
    }

    /**
     * Resolve the middleware handler.
     */
    private resolve(handler: any): any {
        // If it's a string, try resolving from aliases first, then container
        if (typeof handler === 'string') {
            if (this.aliases[handler]) {
                return this.resolve(this.aliases[handler]);
            }
            if (this.container && this.container.has(handler)) {
                return this.container.make(handler);
            }
            return handler;
        }

        // If it's a class/constructor (has handle on prototype), instantiate it
        if (typeof handler === 'function') {
            const isClass = /^\s*class\s+/.test(handler.toString()) ||
                (handler.prototype && typeof handler.prototype.handle === 'function');

            if (isClass) {
                if (this.container) {
                    return this.container.make(handler);
                }
                return new (handler as any)();
            }
        }

        return handler;
    }

    /**
     * Flatten handlers by resolving groups and aliases.
     */
    private flattenHandlers(handlers: any[]): any[] {
        let flattened: any[] = [];

        for (const handler of handlers) {
            if (typeof handler === 'string') {
                const [name, args] = handler.split(':');
                if (this.middlewareGroups[name]) {
                    flattened.push(...this.flattenHandlers(this.middlewareGroups[name]));
                    continue;
                }

                if (this.aliases[name]) {
                    const resolved = this.aliases[name];
                    // If it's an alias but we have args, we keep it as a string to parse later in handle()
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
    private parseHandler(handler: any): { handler: any, args: any[] } {
        if (typeof handler !== 'string') {
            return { handler, args: [] };
        }

        const [name, ...args] = handler.split(':');
        return {
            handler: name,
            args: args.length > 0 ? args[0].split(',') : []
        };
    }
}
