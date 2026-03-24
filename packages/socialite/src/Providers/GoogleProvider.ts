
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class GoogleProvider extends AbstractProvider {
    protected userScopes: string[] = ['openid', 'profile', 'email'];

    protected getAuthUrl(state: string): string {
        const query = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            scope: this.userScopes.join(' '),
            response_type: 'code',
            state: state,
            prompt: 'select_account',
        };

        return `https://accounts.google.com/o/oauth2/auth?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://oauth2.googleapis.com/token';
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.sub,
            nickname: user.nickname,
            name: user.name,
            email: user.email,
            avatar: user.picture,
            token: '', // Set in base class
            user: user,
        };
    }
}
