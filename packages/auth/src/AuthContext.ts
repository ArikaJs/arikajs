import { Guard } from './Guard';
import { AuthManager } from './AuthManager';

export class AuthContext {
    private guards: Map<string, Guard> = new Map();
    private request: any;
    private manager: AuthManager;

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
            this.guards.set(name, this.manager.resolveGuard(name, this.request));
        }

        return this.guards.get(name)!;
    }

    // Proxy methods to the default guard
    public async check(): Promise<boolean> {
        return await this.guard().check();
    }

    public async guest(): Promise<boolean> {
        return await this.guard().guest();
    }

    public async user(): Promise<any> {
        return await this.guard().user();
    }

    public async id(): Promise<string | number | null> {
        return await this.guard().id();
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        return await this.guard().validate(credentials);
    }

    public setUser(user: any): void {
        this.guard().setUser(user);
    }

    public async attempt(credentials: Record<string, any>, remember: boolean = false): Promise<boolean | string> {
        return await this.manager.attemptForContext(this, credentials, remember);
    }

    public async login(user: any, remember: boolean = false): Promise<void> {
        return await this.manager.loginForContext(this, user, remember);
    }

    public async logout(): Promise<void> {
        return await this.manager.logoutForContext(this);
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
}
