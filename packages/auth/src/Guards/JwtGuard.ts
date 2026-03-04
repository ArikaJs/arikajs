import { Guard } from '../Guard';
import { UserProvider } from '../Contracts/UserProvider';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export class JwtGuard implements Guard {
    private provider: UserProvider;
    private request: any;
    private secret: string;
    private options: jwt.SignOptions | jwt.VerifyOptions;
    private loggedUser: any = null;

    constructor(provider: UserProvider, request: any, secret: string, options: any = {}) {
        this.provider = provider;
        this.request = request;
        this.secret = secret;
        this.options = options;
    }

    public async check(): Promise<boolean> {
        return !!(await this.user());
    }

    public async guest(): Promise<boolean> {
        return !(await this.check());
    }

    public async user(): Promise<any> {
        if (this.loggedUser) return this.loggedUser;

        const token = this.getTokenForRequest();
        if (!token) return null;

        try {
            const decoded = jwt.verify(token, this.secret, this.options as jwt.VerifyOptions) as any;
            if (decoded && decoded.sub) {
                // If the provider supports retrieving by ID, use it for stateless verification payload validation
                // In a purely stateless app, you might just return the decoded payload or a Model proxy instead
                // of querying the DB. But to ensure user is active/exists, we retrieve it:
                this.loggedUser = await this.provider.retrieveById(decoded.sub);
                return this.loggedUser;
            }
        } catch (e) {
            return null; // Invalid token
        }

        return null;
    }

    public async id(): Promise<string | number | null> {
        if (this.loggedUser) return this.loggedUser.id;

        const token = this.getTokenForRequest();
        if (!token) return null;

        try {
            const decoded = jwt.verify(token, this.secret, this.options as jwt.VerifyOptions) as any;
            return decoded ? decoded.sub : null;
        } catch (e) {
            return null;
        }
    }

    public async validate(credentials: Record<string, any>): Promise<boolean> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (!user) return false;

        return await this.provider.validateCredentials(user, credentials);
    }

    /**
     * Authenticate a user and return a JWT token and refresh token
     */
    public async attempt(credentials: Record<string, any>): Promise<{ access_token: string, refresh_token?: string } | false> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (user && await this.provider.validateCredentials(user, credentials)) {
            this.login(user);
            return await this.issueTokens(user);
        }
        return false;
    }

    public async issueTokens(user: any, additionalPayload: object = {}): Promise<{ access_token: string, refresh_token?: string }> {
        const payload = { sub: user.id, ...additionalPayload };
        const access_token = jwt.sign(payload, this.secret, this.options as jwt.SignOptions);

        const response: { access_token: string, refresh_token?: string } = { access_token };

        if (this.provider.updateRefreshToken) {
            const refresh_token = crypto.randomBytes(40).toString('hex');
            await this.provider.updateRefreshToken(user, refresh_token);
            response.refresh_token = refresh_token;
        }

        return response;
    }

    public async refresh(refreshToken: string): Promise<{ access_token: string, refresh_token?: string }> {
        if (!this.provider.retrieveByRefreshToken) {
            throw new Error('UserProvider does not support retrieveByRefreshToken');
        }

        const user = await this.provider.retrieveByRefreshToken(refreshToken);
        if (!user) {
            throw new Error('Invalid or expired refresh token');
        }

        return await this.issueTokens(user);
    }

    public login(user: any): void {
        this.setUser(user);
    }

    public logout(): void {
        this.loggedUser = null;
    }

    public setUser(user: any): void {
        this.loggedUser = user;
        if (this.request) {
            this.request.user = user;
        }
    }

    public setRequest(request: any): void {
        this.request = request;
    }

    protected getTokenForRequest(): string | null {
        let authHeader: string | undefined;

        // Support ArikaJS Request with header() method
        if (typeof this.request?.header === 'function') {
            authHeader = this.request.header('authorization') as string;
        }
        // Fallback to raw headers object
        if (!authHeader && this.request?.headers?.['authorization']) {
            authHeader = this.request.headers['authorization'];
        }

        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }
}
