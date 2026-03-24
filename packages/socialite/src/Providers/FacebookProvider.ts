
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class FacebookProvider extends AbstractProvider {
    protected userScopes: string[] = ['email', 'public_profile'];

    protected getAuthUrl(state: string): string {
        const query = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            state: state,
            scope: this.userScopes.join(','),
            response_type: 'code',
            display: 'popup',
        };

        return `https://www.facebook.com/v19.0/dialog/oauth?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://graph.facebook.com/v19.0/oauth/access_token';
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://graph.facebook.com/v19.0/me', {
            params: {
                fields: 'name,email,gender,verified,picture.type(large)',
                access_token: token,
            }
        });

        return response.data;
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.id || null,
            nickname: undefined,
            name: user.name || null,
            email: user.email || null,
            avatar: user.picture?.data?.url || null,
            token: '',
            user: user,
        };
    }
}
