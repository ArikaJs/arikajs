
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class GitLabProvider extends AbstractProvider {
    protected userScopes: string[] = ['read_user'];

    protected getAuthUrl(state: string): string {
        const query = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            state: state,
            scope: this.userScopes.join(' '),
            response_type: 'code',
        };

        return `https://gitlab.com/oauth/authorize?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://gitlab.com/oauth/token';
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://gitlab.com/api/v4/user', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.id.toString(),
            nickname: user.username,
            name: user.name,
            email: user.email,
            avatar: user.avatar_url,
            token: '',
            user: user,
        };
    }
}
