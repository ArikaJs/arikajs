import { Guard } from '../Guard';
import { UserProvider } from '../Contracts/UserProvider';

export class BasicGuard implements Guard {
    private provider: UserProvider;
    private request: any;
    private loggedUser: any = null;

    constructor(provider: UserProvider, request: any) {
        this.provider = provider;
        this.request = request;
    }

    public async check(): Promise<boolean> {
        return !!(await this.user());
    }

    public async guest(): Promise<boolean> {
        return !(await this.check());
    }

    public async user(): Promise<any> {
        if (this.loggedUser) return this.loggedUser;

        const credentials = this.getCredentialsFromRequest();
        if (!credentials) return null;

        const user = await this.provider.retrieveByCredentials(credentials);
        if (user && await this.provider.validateCredentials(user, credentials)) {
            this.loggedUser = user;
            return user;
        }

        return null;
    }

    public async id(): Promise<string | number | null> {
        const user = await this.user();
        return user ? user.id : null;
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (!user) return false;

        return await this.provider.validateCredentials(user, credentials);
    }

    public setRequest(request: any): void {
        this.request = request;
    }

    public setUser(user: any): void {
        this.loggedUser = user;
    }

    private getCredentialsFromRequest(): Record<string, any> | null {
        if (this.request?.headers?.['authorization']) {
            const authHeader = this.request.headers['authorization'];
            if (authHeader.startsWith('Basic ')) {
                const b64 = authHeader.substring(6);
                const decoded = Buffer.from(b64, 'base64').toString('ascii');
                const [email, password] = decoded.split(':');
                return { email, password };
            }
        }
        return null;
    }
}
