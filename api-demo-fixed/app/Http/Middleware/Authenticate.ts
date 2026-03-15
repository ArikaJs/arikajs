import { Authenticate as Middleware, Request } from 'arikajs';

export class Authenticate extends Middleware {
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected redirectTo(request: Request): string | null {
        return request.expectsJson() ? null : '/auth/login';
    }
}
