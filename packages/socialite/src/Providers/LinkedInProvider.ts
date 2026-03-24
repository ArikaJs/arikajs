
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class LinkedInProvider extends AbstractProvider {
    protected userScopes: string[] = ['openid', 'profile', 'email'];

    protected getAuthUrl(state: string): string {
        const query = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            state: state,
            scope: this.userScopes.join(' '),
            response_type: 'code',
        };

        return `https://www.linkedin.com/oauth/v2/authorization?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://www.linkedin.com/oauth/v2/accessToken';
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.sub,
            nickname: undefined,
            name: user.name,
            email: user.email,
            avatar: user.picture,
            token: '',
            user: user,
        };
    }
}
