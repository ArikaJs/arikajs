import { Guard } from './Guard';
import { AuthManager } from './AuthManager';

export class AuthContext {
    private guards: Map<string, Guard> = new Map();
    private request: any;
    private manager: AuthManager;

    private resolvedUsers: Map<string, any> = new Map();

    constructor(manager: AuthManager, request: any) {
        this.manager = manager;
        this.request = request;
    }

    public guard(name?: string): Guard {
        name = name || this.manager.getDefaultGuard();

        if (!name) {
            throw new Error('No auth guard defined.');
        }

        if (!this.guards.has(name)) {
            const guard = this.manager.resolveGuard(name, this.request);
            const user = this.resolvedUsers.get(name);
            if (user) guard.setUser(user);
            this.guards.set(name, guard);
        }

        return this.guards.get(name)!;
    }

    // Proxy methods to the default guard
    public async check(): Promise<boolean> {
        return !!(await this.user());
    }

    public async guest(): Promise<boolean> {
        return !(await this.check());
    }

    public async user(guardName?: string): Promise<any> {
        const name = guardName || this.manager.getDefaultGuard();
        if (this.resolvedUsers.has(name)) {
            return this.resolvedUsers.get(name);
        }

        const user = await this.guard(name).user();
        this.resolvedUsers.set(name, user);
        return user;
    }

    public async id(guardName?: string): Promise<string | number | null> {
        const user = await this.user(guardName);
        return user ? user.id : null;
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        return await this.guard().validate(credentials);
    }

    public setUser(user: any, guardName?: string): void {
        const name = guardName || this.manager.getDefaultGuard();
        this.resolvedUsers.set(name, user);
        const guard = this.guard(name);
        if (guard && typeof guard.setUser === 'function') {
            guard.setUser(user);
        }
    }

    public async attempt(credentials: Record<string, any>, remember: boolean = false, guardName?: string): Promise<boolean | string> {
        return await this.manager.attemptForContext(this, credentials, remember, guardName);
    }

    public async login(user: any, remember: boolean = false, guardName?: string): Promise<void> {
        return await this.manager.loginForContext(this, user, remember, guardName);
    }

    public async logout(guardName?: string): Promise<void> {
        const name = guardName || this.manager.getDefaultGuard();
        this.resolvedUsers.delete(name);
        return await this.manager.logoutForContext(this, guardName);
    }

    public async sendVerification(user?: any): Promise<void> {
        return await this.manager.sendVerification(this, user);
    }

    public async isLocked(credentials: Record<string, any>): Promise<boolean> {
        return await this.manager.isLocked(this, credentials);
    }

    public async unlockAccount(credentials: Record<string, any>): Promise<void> {
        return await this.manager.unlockAccount(this, credentials);
    }

    public getRequest(): any {
        return this.request;
    }

    public resolve(token: any): any {
        return this.guard(token as string);
    }
}
