
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class XProvider extends AbstractProvider {
    protected userScopes: string[] = ['users.read', 'tweet.read'];

    protected getAuthUrl(state: string): string {
        const query = {
            response_type: 'code',
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            scope: this.userScopes.join(' '),
            state: state,
            code_challenge: 'challenge', // Simplification for now, should be dynamic in full implementation
            code_challenge_method: 'plain',
        };

        return `https://twitter.com/i/oauth2/authorize?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://api.twitter.com/2/oauth2/token';
    }

    protected getTokenFields(code: string): any {
        return {
            ...super.getTokenFields(code),
            code_verifier: 'challenge', // Matches code_challenge
        };
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://api.twitter.com/2/users/me', {
            params: { 'user.fields': 'profile_image_url,description' },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    protected mapUserToObject(payload: any): User {
        const user = payload.data;
        return {
            id: user.id,
            nickname: user.username,
            name: user.name,
            email: undefined, // Twitter doesn't return email by default in OAuth 2.0 basic scopes
            avatar: user.profile_image_url,
            token: '',
            user: payload,
        };
    }
}
