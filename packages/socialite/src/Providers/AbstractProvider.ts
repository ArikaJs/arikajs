
import { Provider, User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export abstract class AbstractProvider implements Provider {
    protected request: any;
    protected isStateless: boolean = false;
    protected config: any;
    protected userScopes: string[] = [];

    constructor(config: any) {
        this.config = config;
    }

    public setRequest(request: any): this {
        this.request = request;
        return this;
    }

    public stateless(): this {
        this.isStateless = true;
        return this;
    }

    public scopes(scopes: string[]): this {
        this.userScopes = scopes;
        return this;
    }

    /**
     * Get the authentication URL for the provider.
     */
    protected abstract getAuthUrl(state: string): string;

    /**
     * Get the token URL for the provider.
     */
    protected abstract getTokenUrl(): string;

    /**
     * Get the raw user for the given access token.
     */
    protected abstract getUserByToken(token: string): Promise<any>;

    /**
     * Map the raw user array to a Socialite User instance.
     */
    protected abstract mapUserToObject(user: any): User;

    /**
     * Redirect the user to the authentication page.
     */
    public async redirect(): Promise<any> {
        const state = this.isStateless ? '' : this.generateState();
        
        if (!this.isStateless && this.request && this.request.session) {
            this.request.session().put('socialite_state', state);
        }

        const url = this.getAuthUrl(state);

        if (this.request && this.request.response) {
            return this.request.response().redirect(url);
        }

        return url;
    }

    /**
     * Get the User instance for the authenticated user.
     */
    public async user(): Promise<User> {
        if (!this.isStateless && !this.hasValidState()) {
            throw new Error('Invalid OAuth state.');
        }

        const response = await this.getAccessTokenResponse(this.getCode());
        const token = response.access_token;
        const rawUser = await this.getUserByToken(token);

        const user = this.mapUserToObject(rawUser);
        user.token = token;
        user.refreshToken = response.refresh_token;
        user.expiresIn = response.expires_in;

        return user;
    }

    protected generateState(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    protected hasValidState(): boolean {
        if (!this.request) return false;
        const state = this.request.input('state');
        const sessionState = this.request.session().get('socialite_state');
        return state && sessionState && state === sessionState;
    }

    protected getCode(): string {
        return this.request ? this.request.input('code') : '';
    }

    protected async getAccessTokenResponse(code: string): Promise<any> {
        const response = await axios.post(this.getTokenUrl(), queryString.stringify(this.getTokenFields(code)), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    }

    protected getTokenFields(code: string): any {
        return {
            client_id: this.config.client_id,
            client_secret: this.config.client_secret,
            code: code,
            redirect_uri: this.config.redirect,
            grant_type: 'authorization_code',
        };
    }
}
