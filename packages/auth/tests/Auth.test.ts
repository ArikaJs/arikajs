import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { AuthManager, Hasher, UserProvider, AuthContext } from '../src';
import { SessionGuard } from '../src/Guards/SessionGuard';

class MockPoolProvider implements UserProvider {
    private users = [
        { id: 1, email: 'test@example.com', password: '$2a$10$...' }
    ];

    async retrieveById(id: string | number): Promise<any> {
        return this.users.find(u => u.id === Number(id)) || null;
    }

    async retrieveByCredentials(credentials: Record<string, any>): Promise<any> {
        if (credentials.email === 'test@example.com') {
            return this.users[0];
        }
        return null;
    }

    validateCredentials(user: any, credentials: Record<string, any>): boolean {
        return credentials.password === 'secret';
    }
}

describe('Arika Auth', () => {
    let authManager: AuthManager;
    let config: any;

    beforeEach(() => {
        config = {
            default: 'web',
            guards: {
                web: { driver: 'session', provider: 'users' },
                api: { driver: 'token', provider: 'users' }
            }
        };
        authManager = new AuthManager(config);
        authManager.registerProvider('users', new MockPoolProvider());
    });

    it('resolves session guard by default via context', async () => {
        const request = { session: { get: () => null, put: () => { } } };
        const ctx = authManager.createContext(request);
        const guard = ctx.guard();
        assert.ok(guard);
        const isSessionGuard = guard instanceof SessionGuard || guard.constructor.name === 'SessionGuard';
        assert.ok(isSessionGuard);
    });

    it('proxies methods through context', async () => {
        const session: Record<string, any> = {};
        const request = {
            session: {
                get: (key: string) => session[key] || null,
                put: (key: string, val: any) => { session[key] = val; },
                forget: (key: string) => { delete session[key]; }
            }
        };
        const ctx = authManager.createContext(request);

        const success = await ctx.attempt({ email: 'test@example.com', password: 'secret' });
        assert.strictEqual(success, true);

        const user = await ctx.user();
        assert.ok(user);
        assert.strictEqual(user.id, 1);

        const check = await ctx.check();
        assert.strictEqual(check, true);

        await ctx.logout();
        const checkAfterLogout = await ctx.check();
        assert.strictEqual(checkAfterLogout, false);
    });

    it('can validate credentials via context guard', async () => {
        const request = { session: { get: () => null, put: () => { } } };
        const ctx = authManager.createContext(request);
        const guard = ctx.guard('web');
        const success = await guard.validate({ email: 'test@example.com', password: 'secret' });
        assert.strictEqual(success, true);

        const fail = await guard.validate({ email: 'test@example.com', password: 'wrong' });
        assert.strictEqual(fail, false);
    });

    it('hashes passwords securely', async () => {
        const password = 'my-secret-password';
        const hash = await Hasher.make(password);

        assert.ok(hash.length > 0);
        assert.notStrictEqual(password, hash);

        const valid = await Hasher.check(password, hash);
        assert.strictEqual(valid, true);

        const invalid = await Hasher.check('wrong', hash);
        assert.strictEqual(invalid, false);
    });

    it('request-scoped auth context isolation', async () => {
        // Simulate two concurrent requests
        const session1: Record<string, any> = {};
        const request1 = {
            session: {
                get: (key: string) => session1[key] || null,
                put: (key: string, val: any) => { session1[key] = val; },
                forget: (key: string) => { delete session1[key]; }
            }
        };

        const session2: Record<string, any> = {};
        const request2 = {
            session: {
                get: (key: string) => session2[key] || null,
                put: (key: string, val: any) => { session2[key] = val; },
                forget: (key: string) => { delete session2[key]; }
            }
        };

        const ctx1 = authManager.createContext(request1);
        const ctx2 = authManager.createContext(request2);

        // Log in user on ctx1 only
        await ctx1.attempt({ email: 'test@example.com', password: 'secret' });

        const user1 = await ctx1.user();
        assert.ok(user1);

        // ctx2 should NOT have a user
        const user2 = await ctx2.user();
        assert.strictEqual(user2, null);
    });

    it('middleware protects routes with AuthContext', async () => {
        const { Authenticate } = require('../src/Middleware/Authenticate');
        const middleware = new Authenticate(authManager);

        const next = async () => 'success';

        // Mock request with token
        const request = {
            headers: { authorization: 'Bearer token-123' },
            user: null,
            session: { get: () => null, put: () => { } }
        };

        // Override config to default to 'api' for this test
        authManager.shouldUse('api');

        // Hack: mock the provider to accept this token
        const provider = authManager['providers'].get('users') as MockPoolProvider;
        provider.retrieveByCredentials = async (creds) => {
            if (creds.api_token === 'token-123') return { id: 1 };
            return null;
        };

        // Should pass
        const result = await middleware.handle(request, next);
        assert.strictEqual(result, 'success');

        // req.auth should have been set
        assert.ok((request as any).auth);
        const user = await (request as any).auth.user();
        assert.strictEqual(user.id, 1);
    });
});
