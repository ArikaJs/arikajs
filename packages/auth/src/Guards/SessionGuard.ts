import { Guard } from '../Guard';
import { UserProvider } from '../Contracts/UserProvider';
import * as crypto from 'crypto';

export class SessionGuard implements Guard {
    private provider: UserProvider;
    private session: any;
    private loggedUser: any = null;

    constructor(provider: UserProvider, session: any) {
        this.provider = provider;
        // If no session is provided, create a lightweight in-memory fallback
        // so the guard doesn't crash when there's no session middleware
        if (session && (typeof session.get === 'function' || typeof session.put === 'function')) {
            this.session = session;
        } else {
            const store: Record<string, any> = {};
            this.session = {
                get(key: string) { return store[key] ?? null; },
                put(key: string, value: any) { store[key] = value; },
                forget(key: string) { delete store[key]; },
            };
        }
    }

    public async check(): Promise<boolean> {
        return !!(await this.user());
    }

    public async guest(): Promise<boolean> {
        return !(await this.check());
    }

    public async user(): Promise<any> {
        if (this.loggedUser) {
            return this.loggedUser;
        }

        const id = this.session.get ? this.session.get('auth_user_id') : null;

        if (id) {
            this.loggedUser = await this.provider.retrieveById(id);
        } else {
            // Check for remember me cookie
            const rememberTokenString = this.getRememberCookie();
            if (rememberTokenString) {
                const [userId, token] = rememberTokenString.split('|');
                if (userId && token && this.provider.retrieveByToken) {
                    const user = await this.provider.retrieveByToken(userId, token);
                    if (user) {
                        this.login(user, true); // re-authenticate
                        this.loggedUser = user;
                    }
                }
            }
        }

        return this.loggedUser;
    }

    public async id(): Promise<string | number | null> {
        const user = await this.user();
        return user ? user.id : null;
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (!user) {
            return false;
        }

        return await this.provider.validateCredentials(user, credentials);
    }

    public async attempt(credentials: Record<string, any>, remember: boolean = false): Promise<boolean> {
        if (await this.validate(credentials)) {
            const user = await this.provider.retrieveByCredentials(credentials);
            await this.login(user, remember);
            return true;
        }
        return false;
    }

    public async login(user: any, remember: boolean = false): Promise<void> {
        this.loggedUser = user;
        if (this.session.put) {
            this.session.put('auth_user_id', user.id);
        }

        if (remember) {
            const token = crypto.randomBytes(32).toString('hex');

            if (this.provider.updateRememberToken) {
                await this.provider.updateRememberToken(user, token);
            }

            this.queueRememberCookie(user.id, token);
        }
    }

    public logout(): void {
        const userId = this.loggedUser?.id;
        this.loggedUser = null;

        if (this.session.forget) {
            this.session.forget('auth_user_id');
        }

        this.clearRememberCookie();

        if (userId && this.provider.updateRememberToken) {
            // Invalidate token in provider asynchronously 
            this.provider.updateRememberToken({ id: userId }, null).catch(() => { });
        }
    }

    public setUser(user: any): void {
        this.loggedUser = user;
    }

    private request: any;

    public setRequest(request: any): void {
        this.request = request;
        if (request && request.session) {
            this.session = request.session;
        }
    }

    private getRememberCookie(): string | null {
        if (this.request?.cookies && typeof this.request.cookies === 'function') {
            return this.request.cookies('remember_web');
        }
        return this.request?.cookies?.['remember_web'] || null;
    }

    private queueRememberCookie(userId: string | number, token: string): void {
        const val = `${userId}|${token}`;
        if (this.request?.cookie && typeof this.request.cookie === 'function') {
            // Expires in 5 years essentially "forever" in internet time
            this.request.cookie('remember_web', val, { maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
    }

    private clearRememberCookie(): void {
        if (this.request?.clearCookie && typeof this.request.clearCookie === 'function') {
            this.request.clearCookie('remember_web');
        }
    }
}
