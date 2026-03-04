import { Guard } from './Guard';
import { UserProvider } from './Contracts/UserProvider';
import { EventDispatcher } from './Contracts/EventDispatcher';
import { RateLimiter } from './Contracts/RateLimiter';
import { SessionGuard } from './Guards/SessionGuard';
import { TokenGuard } from './Guards/TokenGuard';
import { JwtGuard } from './Guards/JwtGuard';
import { BasicGuard } from './Guards/BasicGuard';
import { AuthContext } from './AuthContext';
import { AsyncLocalStorage } from 'async_hooks';
import { EloquentUserProvider } from './Providers/EloquentUserProvider';

export class AuthManager {
    private providers: Map<string, UserProvider> = new Map();
    private eventDispatcher: EventDispatcher | null = null;
    private rateLimiter: RateLimiter | null = null;
    private config: any;
    private defaultGuard: string;
    private als = new AsyncLocalStorage<AuthContext>();

    constructor(config: any) {
        this.config = config;
        this.defaultGuard = config.default || 'web';
    }

    public setEventDispatcher(dispatcher: EventDispatcher): void {
        this.eventDispatcher = dispatcher;
    }

    public setRateLimiter(limiter: RateLimiter): void {
        this.rateLimiter = limiter;
    }

    public registerProvider(name: string, provider: UserProvider): void {
        this.providers.set(name, provider);
    }

    public extend(name: string, callback: (app: any) => Guard): void {
        // Implementation for custom guards
    }

    public getDefaultGuard(): string {
        return this.defaultGuard;
    }

    public createContext(request: any): AuthContext {
        const context = new AuthContext(this, request);

        // Optionally bind it directly to the request
        if (request) {
            request.auth = context;
        }

        return context;
    }

    public resolveGuard(name: string, request: any): Guard {
        const config = this.config.guards[name];

        if (!config) {
            throw new Error(`Auth guard [${name}] is not defined.`);
        }

        if (config.driver === 'session') {
            return this.createSessionDriver(name, config, request);
        }

        if (config.driver === 'token') {
            return this.createTokenDriver(name, config, request);
        }

        if (config.driver === 'jwt') {
            return this.createJwtDriver(name, config, request);
        }

        if (config.driver === 'basic') {
            return this.createBasicDriver(name, config, request);
        }

        throw new Error(`Auth driver [${config.driver}] for guard [${name}] is not supported.`);
    }

    private createSessionDriver(name: string, config: any, request: any): SessionGuard {
        const provider = this.getProvider(config.provider);
        return new SessionGuard(provider, request.session);
    }

    private createTokenDriver(name: string, config: any, request: any): Guard {
        const provider = this.getProvider(config.provider);
        return new TokenGuard(provider, request);
    }

    private createJwtDriver(name: string, config: any, request: any): Guard {
        const provider = this.getProvider(config.provider);
        return new JwtGuard(provider, request, config.secret || 'default_secret', config.options || {});
    }

    private createBasicDriver(name: string, config: any, request: any): Guard {
        const provider = this.getProvider(config.provider);
        return new BasicGuard(provider, request);
    }

    private getProvider(name: string): UserProvider {
        // 1. Check if registered manually
        if (this.providers.has(name)) {
            return this.providers.get(name)!;
        }

        // 2. Resolve from config
        const config = this.config.providers?.[name];
        if (!config) {
            throw new Error(`User provider [${name}] is not defined.`);
        }

        if (config.driver === 'eloquent') {
            const provider = new EloquentUserProvider(config.model);
            this.providers.set(name, provider);
            return provider;
        }

        throw new Error(`User provider driver [${config.driver}] is not supported.`);
    }

    public shouldUse(name: string): void {
        this.defaultGuard = name;
    }

    public runWithContext<T>(context: AuthContext, fn: () => T | Promise<T>): T | Promise<T> {
        return this.als.run(context, fn);
    }

    private getContext(): AuthContext {
        const ctx = this.als.getStore();
        if (!ctx) {
            throw new Error('AuthContext not found. Ensure you are running within a request scope or use req.auth instead of the global facade.');
        }
        return ctx;
    }

    // Proxy methods to the context
    public async check(): Promise<boolean> {
        return await this.getContext().check();
    }

    public async guest(): Promise<boolean> {
        return await this.getContext().guest();
    }

    public async user(): Promise<any> {
        return await this.getContext().user();
    }

    public async id(): Promise<string | number | null> {
        return await this.getContext().id();
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        return await this.getContext().validate(credentials);
    }

    public setUser(user: any): void {
        this.getContext().setUser(user);
    }

    public async attempt(credentials: Record<string, any>, remember: boolean = false): Promise<boolean | string> {
        return await this.getContext().attempt(credentials, remember);
    }

    public async login(user: any, remember: boolean = false): Promise<void> {
        return await this.getContext().login(user, remember);
    }

    public async logout(): Promise<void> {
        return await this.getContext().logout();
    }

    // Called by AuthContext to run attempts
    public async attemptForContext(context: AuthContext, credentials: Record<string, any>, remember: boolean = false): Promise<boolean | string> {
        this.fireEvent('Auth.Attempting', { credentials, remember, guard: this.defaultGuard });

        const throttleKey = this.getThrottleKey(credentials, context.getRequest());

        if (throttleKey && this.rateLimiter) {
            if (await this.rateLimiter.tooManyAttempts(throttleKey, 5)) {
                this.fireEvent('Auth.Lockout', { credentials });
                throw new Error('Too many login attempts. Please try again later.');
            }
        }

        const guard = context.guard() as any;
        if (typeof guard.attempt === 'function') {
            const successOrToken = await guard.attempt(credentials, remember);

            if (successOrToken) {
                if (throttleKey && this.rateLimiter) {
                    await this.rateLimiter.clear(throttleKey);
                }
                const user = await guard.user();
                this.fireEvent('Auth.Login', { user, guard: this.defaultGuard });
                return successOrToken; // Can return boolean true or JWT string
            }

            if (throttleKey && this.rateLimiter) {
                await this.rateLimiter.hit(throttleKey, 1); // 1 minute decay
            }

            this.fireEvent('Auth.Failed', { credentials, guard: this.defaultGuard });
            return false;
        }

        throw new Error(`Guard [${this.defaultGuard}] does not support login attempts.`);
    }

    // Called by AuthContext to log in
    public async loginForContext(context: AuthContext, user: any, remember: boolean = false): Promise<void> {
        const guard = context.guard() as any;
        if (typeof guard.login === 'function') {
            await guard.login(user, remember);
            this.fireEvent('Auth.Login', { user, guard: this.defaultGuard });
            return;
        }
        throw new Error(`Guard [${this.defaultGuard}] does not support login.`);
    }

    // Called by AuthContext to log out
    public async logoutForContext(context: AuthContext): Promise<void> {
        const guard = context.guard() as any;
        const user = await guard.user();

        if (typeof guard.logout === 'function') {
            guard.logout();
            this.fireEvent('Auth.Logout', { user, guard: this.defaultGuard });
            return;
        }
        throw new Error(`Guard [${this.defaultGuard}] does not support logout.`);
    }

    // ── Email Verification ──────────────────────────────────────────
    public async sendVerification(context: AuthContext, user?: any): Promise<void> {
        const targetUser = user || await context.user();
        if (!targetUser) {
            throw new Error('No authenticated user to verify.');
        }

        if (typeof targetUser.hasVerifiedEmail === 'function' && targetUser.hasVerifiedEmail()) {
            return; // Already verified
        }

        if (typeof targetUser.sendEmailVerificationNotification === 'function') {
            await targetUser.sendEmailVerificationNotification();
            this.fireEvent('Auth.VerificationSent', { user: targetUser });
        } else {
            throw new Error('User model does not implement sendEmailVerificationNotification().');
        }
    }

    // ── Account Locking ─────────────────────────────────────────────
    private get lockoutThreshold(): number {
        return this.config.lockout?.maxAttempts ?? 5;
    }

    private get lockoutDuration(): number {
        return this.config.lockout?.decayMinutes ?? 15;
    }

    public async isLocked(context: AuthContext, credentials: Record<string, any>): Promise<boolean> {
        if (!this.rateLimiter) return false;

        const throttleKey = this.getLockKey(credentials, context.getRequest());
        if (!throttleKey) return false;

        return await this.rateLimiter.tooManyAttempts(throttleKey, this.lockoutThreshold);
    }

    public async unlockAccount(context: AuthContext, credentials: Record<string, any>): Promise<void> {
        if (!this.rateLimiter) return;

        const throttleKey = this.getLockKey(credentials, context.getRequest());
        if (throttleKey) {
            await this.rateLimiter.clear(throttleKey);
            this.fireEvent('Auth.AccountUnlocked', { credentials });
        }
    }

    private getLockKey(credentials: Record<string, any>, request: any): string | null {
        if (credentials.email) {
            const ip = request?.ip || '127.0.0.1';
            return `account_lock:${credentials.email}:${ip}`;
        }
        return null;
    }

    // ── Internals ───────────────────────────────────────────────────
    private fireEvent(name: string, payload: any): void {
        if (this.eventDispatcher) {
            this.eventDispatcher.dispatch(name, payload);
        }
    }

    private getThrottleKey(credentials: Record<string, any>, request: any): string | null {
        if (credentials.email) {
            const ip = request?.ip || '127.0.0.1';
            return `login_attempts:${credentials.email}:${ip}`;
        }
        return null;
    }
}
