import { Request } from './Request';
import { Response } from './Response';

/**
 * Middleware contract for ArikaJS.
 */
export interface Middleware {
    /**
     * Handle an incoming request.
     */
    handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> | Response;
}

/**
 * Type for middleware that can be either a class or a function.
 */
export type MiddlewareHandler =
    | Middleware
    | ((request: Request, next: (request: Request) => Promise<Response> | Response, response?: Response) => Promise<Response> | Response);
