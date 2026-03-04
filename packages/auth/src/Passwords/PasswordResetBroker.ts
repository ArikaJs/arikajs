import * as crypto from 'crypto';
import { Hasher } from '../Hasher';
import { UserProvider } from '../Contracts/UserProvider';
import { PasswordResetStatus } from '../Contracts/PasswordBroker';

export interface TokenRepository {
    create(user: any): Promise<string>;
    exists(user: any, token: string): Promise<boolean>;
    delete(user: any): Promise<void>;
    deleteExpired(): Promise<void>;
}

/**
 * In-memory token repository (production apps should use a database-backed one)
 */
export class InMemoryTokenRepository implements TokenRepository {
    private tokens: Map<string, { token: string, createdAt: Date }> = new Map();
    private expiryMinutes: number;

    constructor(expiryMinutes: number = 60) {
        this.expiryMinutes = expiryMinutes;
    }

    public async create(user: any): Promise<string> {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        this.tokens.set(String(user.id), {
            token: hashedToken,
            createdAt: new Date(),
        });

        return rawToken; // Return un-hashed version to be sent via email
    }

    public async exists(user: any, token: string): Promise<boolean> {
        const record = this.tokens.get(String(user.id));
        if (!record) return false;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Check expiry
        const now = new Date();
        const diffMs = now.getTime() - record.createdAt.getTime();
        const diffMins = diffMs / (1000 * 60);

        if (diffMins > this.expiryMinutes) {
            this.tokens.delete(String(user.id));
            return false;
        }

        return record.token === hashedToken;
    }

    public async delete(user: any): Promise<void> {
        this.tokens.delete(String(user.id));
    }

    public async deleteExpired(): Promise<void> {
        const now = new Date();
        for (const [key, record] of this.tokens.entries()) {
            const diffMs = now.getTime() - record.createdAt.getTime();
            const diffMins = diffMs / (1000 * 60);
            if (diffMins > this.expiryMinutes) {
                this.tokens.delete(key);
            }
        }
    }
}

export class PasswordResetBroker {
    private provider: UserProvider;
    private tokens: TokenRepository;

    constructor(provider: UserProvider, tokens?: TokenRepository) {
        this.provider = provider;
        this.tokens = tokens || new InMemoryTokenRepository(60);
    }

    /**
     * Send a password reset link to a user.
     */
    public async sendResetLink(credentials: Record<string, any>): Promise<string> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (!user) {
            return PasswordResetStatus.INVALID_USER;
        }

        const token = await this.tokens.create(user);

        if (typeof user.sendPasswordResetNotification === 'function') {
            await user.sendPasswordResetNotification(token);
        }

        return PasswordResetStatus.RESET_LINK_SENT;
    }

    /**
     * Reset the password for the given token.
     */
    public async reset(
        credentials: Record<string, any>,
        callback: (user: any, password: string) => Promise<void>
    ): Promise<string> {
        const user = await this.provider.retrieveByCredentials(credentials);
        if (!user) {
            return PasswordResetStatus.INVALID_USER;
        }

        if (!credentials.token || !(await this.tokens.exists(user, credentials.token))) {
            return PasswordResetStatus.INVALID_TOKEN;
        }

        await callback(user, credentials.password);
        await this.tokens.delete(user);

        return PasswordResetStatus.PASSWORD_RESET;
    }

    /**
     * Clean up expired tokens
     */
    public async deleteExpiredTokens(): Promise<void> {
        await this.tokens.deleteExpired();
    }
}
