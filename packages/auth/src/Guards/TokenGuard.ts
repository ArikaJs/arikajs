import { Guard } from '../Guard';

export class TokenGuard implements Guard {
    private provider: any; // UserProvider
    private storageKey: string = 'api_token';
    private inputKey: string = 'api_token';
    private request: any;

    constructor(provider: any, request: any, inputKey: string = 'api_token', storageKey: string = 'api_token') {
        this.provider = provider;
        this.request = request;
        this.inputKey = inputKey;
        this.storageKey = storageKey;
    }

    public async user() {
        if (!this.request) return null;

        let token = this.getTokenForRequest();
        if (!token) return null;

        return await this.provider.retrieveByCredentials({ [this.storageKey]: token });
    }

    public async check(): Promise<boolean> {
        return !!(await this.user());
    }

    public async guest(): Promise<boolean> {
        return !(await this.check());
    }

    public async id(): Promise<string | number | null> {
        const user = await this.user();
        return user ? user.id : null;
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        return !!(await this.provider.retrieveByCredentials(credentials));
    }

    public setUser(user: any): void {
        if (this.request) {
            this.request.user = user;
        }
    }

    public setRequest(request: any): void {
        this.request = request;
    }

    protected getTokenForRequest(): string | null {
        // Simple implementation: check query param, input body, or Bearer token
        if (this.request.query && this.request.query[this.inputKey]) {
            return this.request.query[this.inputKey];
        }

        if (this.request.body && this.request.body[this.inputKey]) {
            return this.request.body[this.inputKey];
        }

        if (this.request.headers && this.request.headers['authorization']) {
            const authHeader = this.request.headers['authorization'];
            if (authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7);
            }
        }

        return null;
    }
}
