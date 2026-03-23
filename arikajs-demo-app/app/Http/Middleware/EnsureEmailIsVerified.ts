import { Request, Response, Middleware } from 'arikajs';

export class EnsureEmailIsVerified implements Middleware {
    /**
     * Handle an incoming request.
     */
    public async handle(request: Request, next: (request: Request) => Promise<Response>): Promise<Response> {
        const user = await request.auth.user();

        if (!user || (typeof user.hasVerifiedEmail === 'function' && !user.hasVerifiedEmail())) {
            return request.expectsJson()
                ? (request as any).res.json({ message: 'Your email address is not verified.' }, 403)
                : (request as any).res.redirect('/auth/verify');
        }

        return await next(request);
    }
}
