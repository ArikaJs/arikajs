import { Authenticate as Middleware } from 'arikajs';

export class Authenticate extends Middleware {
    /**
     * Handle an unauthenticated user.
     */
    protected unauthenticated(request: any, guards: string[], response: any): any {
        return response.json({ error: 'Unauthenticated.' }, 401);
    }
}
