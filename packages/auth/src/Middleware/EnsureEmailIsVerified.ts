/**
 * Middleware that ensures the authenticated user has verified their email.
 * Use as: .middleware(['verified'])
 */
export class EnsureEmailIsVerified {
    public async handle(request: any, next: () => Promise<any>): Promise<any> {
        const user = request.auth ? await request.auth.user() : null;

        if (!user) {
            throw new Error('Unauthenticated.');
        }

        if (typeof user.hasVerifiedEmail === 'function' && !user.hasVerifiedEmail()) {
            throw new Error('Your email address is not verified.');
        }

        return next();
    }
}
