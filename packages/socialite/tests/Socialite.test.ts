
import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { 
    SocialiteManager, 
    Socialite, 
    setSocialiteManager, 
    AbstractProvider, 
    User, 
    GoogleProvider, 
    GithubProvider, 
    FacebookProvider, 
    LinkedInProvider, 
    GitLabProvider, 
    SlackProvider, 
    XProvider 
} from '../src/index.js';

class MockProvider extends AbstractProvider {
    protected getAuthUrl(state: string): string {
        return `https://mock.com/auth?state=${state}`;
    }

    protected getTokenUrl(): string {
        return 'https://mock.com/token';
    }

    protected async getUserByToken(token: string): Promise<any> {
        return { id: '123', name: 'Mock User', email: 'mock@example.com' };
    }

    protected mapUserToObject(user: any): User {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: '',
            user: user,
        };
    }

    // Public for testing
    public getCode(): string { return super.getCode(); }
    public hasValidState(): boolean { return super.hasValidState(); }
}

describe('Arika Socialite', () => {
    let manager: SocialiteManager;
    let config: any;

    beforeEach(() => {
        config = {
            providers: {
                google: {
                    client_id: 'google-id',
                    client_secret: 'google-secret',
                    redirect: 'http://localhost/callback',
                },
                github: {
                    client_id: 'github-id',
                    client_secret: 'github-secret',
                    redirect: 'http://localhost/callback',
                },
                facebook: {
                    client_id: 'fb-id',
                    client_secret: 'fb-secret',
                    redirect: 'http://localhost/callback',
                },
                linkedin: {
                    client_id: 'li-id',
                    client_secret: 'li-secret',
                    redirect: 'http://localhost/callback',
                },
                gitlab: {
                    client_id: 'gl-id',
                    client_secret: 'gl-secret',
                    redirect: 'http://localhost/callback',
                },
                slack: {
                    client_id: 'sl-id',
                    client_secret: 'sl-secret',
                    redirect: 'http://localhost/callback',
                },
                x: {
                    client_id: 'x-id',
                    client_secret: 'x-secret',
                    redirect: 'http://localhost/callback',
                }
            }
        };
        manager = new SocialiteManager(config);
        setSocialiteManager(manager);
    });

    it('resolves drivers correctly', () => {
        assert.ok(manager.driver('google') instanceof GoogleProvider);
        assert.ok(manager.driver('github') instanceof GithubProvider);
        assert.ok(manager.driver('facebook') instanceof FacebookProvider);
        assert.ok(manager.driver('linkedin') instanceof LinkedInProvider);
        assert.ok(manager.driver('gitlab') instanceof GitLabProvider);
        assert.ok(manager.driver('slack') instanceof SlackProvider);
        assert.ok(manager.driver('x') instanceof XProvider);
        assert.ok(manager.driver('twitter') instanceof XProvider);
    });

    it('can extend with custom drivers', () => {
        manager.extend('custom', (config) => new MockProvider(config));
        
        config.providers.custom = { client_id: 'custom-id' };
        
        assert.ok(manager.driver('custom') instanceof MockProvider);
    });

    it('throws error for unsupported drivers', () => {
        assert.throws(() => manager.driver('tiktok'), /not configured/);
    });

    it('generates correct redirect URL with state', async () => {
        const sessionValues: any = {};
        const request = {
            session: () => ({
                put: (key: string, val: any) => { sessionValues[key] = val; },
                get: (key: string) => sessionValues[key],
            }),
            response: () => ({
                redirect: (url: string) => url,
            })
        };

        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);

        const url = await provider.redirect();
        assert.ok(url.includes('https://mock.com/auth?state='));
        assert.ok(sessionValues['socialite_state']);
    });

    it('validates state correctly', () => {
        const state = 'random-state';
        const request = {
            input: (key: string) => key === 'state' ? state : null,
            session: () => ({
                get: (key: string) => key === 'socialite_state' ? state : null,
            })
        };

        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);

        assert.strictEqual(provider.hasValidState(), true);
    });

    it('fails on invalid state', () => {
        const request = {
            input: (key: string) => key === 'state' ? 'wrong' : null,
            session: () => ({
                get: (key: string) => key === 'socialite_state' ? 'correct' : null,
            })
        };

        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);

        assert.strictEqual(provider.hasValidState(), false);
    });

    it('can use stateless mode to skip state validation', async () => {
        const provider = new MockProvider(config.providers.google);
        provider.stateless();
        
        const url = await provider.redirect();
        assert.strictEqual(url, 'https://mock.com/auth?state=');
    });

    it('facade works correctly', () => {
        const google = Socialite.driver('google');
        assert.ok(google);
    });
});
