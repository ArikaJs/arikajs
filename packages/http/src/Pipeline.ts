import { Request } from './Request';
import { Response } from './Response';

/**
 * Pipeline executes a stack of middleware for HTTP requests.
 */
export class Pipeline {
    private handlers: any[] = [];

    constructor(private container?: any) { }

    /**
     * Add middleware to the pipeline.
     */
    public pipe(middleware: any | any[]): this {
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
        request: Request,
        destination: (request: Request, response?: Response) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> {
        const invoke = async (index: number, req: Request): Promise<Response> => {
            if (index >= this.handlers.length) {
                return destination(req, response);
            }

            const handler = this.resolve(this.handlers[index]);

            if (typeof handler === 'function') {
                return handler(req, (nextReq: Request) => invoke(index + 1, nextReq), response);
            }

            if (typeof handler === 'object' && 'handle' in handler && typeof handler.handle === 'function') {
                return handler.handle(req, (nextReq: Request) => invoke(index + 1, nextReq), response);
            }

            throw new Error(`Invalid middleware handler at index ${index}`);
        };

        return invoke(0, request);
    }

    /**
     * Resolve the middleware handler.
     */
    private resolve(handler: any): any {
        if (typeof handler === 'string' && this.container) {
            return this.container.make(handler);
        }

        if (typeof handler === 'function') {
            const isClass = /^\s*class\s+/.test(handler.toString()) ||
                (handler.prototype && typeof handler.prototype.handle === 'function');

            if (isClass) {
                return this.container ? this.container.make(handler) : new (handler as any)();
            }
        }

        return handler;
    }
}
