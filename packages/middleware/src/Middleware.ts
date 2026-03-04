/**
 * Middleware contract for ArikaJS.
 */
export interface Middleware<TRequest = any, TResponse = any> {
    /**
     * Handle an incoming request.
     */
    handle(
        request: TRequest,
        next: (request: TRequest) => Promise<TResponse> | TResponse,
        response?: TResponse
    ): Promise<TResponse> | TResponse;
}

/**
 * Type for middleware that can be either a class, a function, or a string key.
 */
export type MiddlewareHandler<TRequest = any, TResponse = any> =
    | Middleware<TRequest, TResponse>
    | ((request: TRequest, next: (request: TRequest) => Promise<TResponse> | TResponse, response?: TResponse) => Promise<TResponse> | TResponse)
    | string
    | any;
