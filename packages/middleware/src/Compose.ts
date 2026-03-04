import { Request, Response } from '@arikajs/http';
import { MiddlewareHandler } from './Middleware';
import { Pipeline } from './Pipeline';

/**
 * Compose multiple middleware handlers into a single middleware handler.
 */
export function compose(middleware: MiddlewareHandler[]): MiddlewareHandler {
    return async (request: Request, next: (request: Request) => Promise<Response> | Response): Promise<Response> => {
        return new Pipeline()
            .pipe(middleware)
            .handle(request, next);
    };
}
