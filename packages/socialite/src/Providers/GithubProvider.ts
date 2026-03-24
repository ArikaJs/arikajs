
import { AbstractProvider } from './AbstractProvider.js';
import { User } from '../Contracts/index.js';
import axios from 'axios';
import queryString from 'query-string';

export class GithubProvider extends AbstractProvider {
    protected userScopes: string[] = ['user:email'];

    protected getAuthUrl(state: string): string {
        const query = {
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect,
            scope: this.userScopes.join(' '),
            state: state,
        };

        return `https://github.com/login/oauth/authorize?${queryString.stringify(query)}`;
    }

    protected getTokenUrl(): string {
        return 'https://github.com/login/oauth/access_token';
    }

    protected async getUserByToken(token: string): Promise<any> {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            }
        });

        const user = response.data;

        if (!user.email && this.userScopes.includes('user:email')) {
            user.email = await this.getEmailByToken(token);
        }

        return user;
    }

    protected async getEmailByToken(token: string): Promise<string | null> {
        try {
            const response = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                }
            });

            const emails = response.data;

            for (const email of emails) {
                if (email.primary && email.verified) {
                    return email.email;
                }
            }

            return emails[0]?.email || null;
        } catch (e) {
            return null;
        }
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.id.toString(),
            nickname: user.login,
            name: user.name || user.login,
            email: user.email,
            avatar: user.avatar_url,
            token: '',
            user: user,
        };
    }
}
