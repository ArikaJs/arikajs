/**
 * Middleware that ensures the authenticated user has verified their email.
 * Use as: .middleware(['verified'])
 */
export class EnsureEmailIsVerified {
    public async handle(request: any, next: (req: any) => Promise<any> | any, response?: any): Promise<any> {
        const user = request.auth ? await request.auth.user() : null;

        if (!user) {
            if (request.expectsJson && request.expectsJson()) {
                return response.json({ message: 'Unauthenticated.' }, 401);
            }
            throw new Error('Unauthenticated.');
        }

        if (typeof user.hasVerifiedEmail === 'function' && !user.hasVerifiedEmail()) {
            if (request.expectsJson && request.expectsJson()) {
                return response.json({ message: 'Your email address is not verified.' }, 403);
            }
            throw new Error('Your email address is not verified.');
        }

        return next(request);
    }
}
