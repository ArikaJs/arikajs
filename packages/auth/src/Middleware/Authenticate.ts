import { AuthManager } from '../AuthManager';

export class Authenticate {
    protected guards: string[] = [];

    private auth: AuthManager;
    constructor(auth: AuthManager) {
        this.auth = auth instanceof AuthManager ? auth : (auth as any).resolve(AuthManager);
    }

    /**
     * Set the guards that should be checked.
     */
    public using(...guards: string[]): this {
        this.guards = guards;
        return this;
    }

    /**
     * Handle the incoming request.
     * Creates a per-request AuthContext and binds it to req.auth
     */
    public async handle(request: any, next: (request: any) => Promise<any> | any, response?: any, ...guards: string[]): Promise<any> {
        // 1. Create an isolated AuthContext for this request (binds to req.auth)
        const context = this.auth.createContext(request);

        // 2. Run the rest of the request within this context (for global facade support)
        return await this.auth.runWithContext(context, async () => {
            // 3. Determine guards to check
            // Priority:
            // 1. Guards passed via middleware string (e.g., 'auth:web,admin')
            // 2. Guards set via .using() in code
            // 3. Default guard from config
            const guardsToCheck = guards.length > 0
                ? guards
                : (this.guards.length === 0 ? [this.auth.getDefaultGuard()] : this.guards);

            // 4. Check each guard
            for (const guard of guardsToCheck) {
                const user = await context.guard(guard).user();
                if (user) {
                    context.setUser(user);
                    this.auth.shouldUse(guard);
                    return next(request);
                }
            }

            // 5. Fail if no guard authenticated
            return this.unauthenticated(request, guardsToCheck, response);
        });
    }

    /**
     * Handle an unauthenticated user.
     */
    protected unauthenticated(request: any, guards: string[], response?: any): any {
        if (request && typeof request.expectsJson === 'function' && request.expectsJson()) {
            return response.json({ message: 'Unauthenticated.' }, 401);
        }

        const redirectTo = this.redirectTo(request);
        if (redirectTo && response) {
            return response.redirect(redirectTo);
        }

        throw new Error('Unauthenticated.');
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected redirectTo(request: any): string | null {
        return '/auth/login';
    }
}
