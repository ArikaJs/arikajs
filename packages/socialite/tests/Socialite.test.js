"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const src_1 = require("../src");
class MockProvider extends src_1.AbstractProvider {
    getAuthUrl(state) {
        return `https://mock.com/auth?state=${state}`;
    }
    getTokenUrl() {
        return 'https://mock.com/token';
    }
    async getUserByToken(token) {
        return { id: '123', name: 'Mock User', email: 'mock@example.com' };
    }
    mapUserToObject(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            token: '',
            user: user,
        };
    }
    // Public for testing
    getCode() { return super.getCode(); }
    hasValidState() { return super.hasValidState(); }
}
(0, node_test_1.describe)('Arika Socialite', () => {
    let manager;
    let config;
    (0, node_test_1.beforeEach)(() => {
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
                }
            }
        };
        manager = new src_1.SocialiteManager(config);
        (0, src_1.setSocialiteManager)(manager);
    });
    (0, node_test_1.it)('resolves drivers correctly', () => {
        const google = manager.driver('google');
        assert.ok(google);
        assert.strictEqual(google.constructor.name, 'GoogleProvider');
        const github = manager.driver('github');
        assert.ok(github);
        assert.strictEqual(github.constructor.name, 'GithubProvider');
        const facebook = manager.driver('facebook');
        assert.ok(facebook);
        assert.strictEqual(facebook.constructor.name, 'FacebookProvider');
    });
    (0, node_test_1.it)('throws error for unsupported drivers', () => {
        assert.throws(() => manager.driver('twitter'), /is not supported yet/);
    });
    (0, node_test_1.it)('generates correct redirect URL with state', async () => {
        const sessionValues = {};
        const request = {
            session: () => ({
                put: (key, val) => { sessionValues[key] = val; },
                get: (key) => sessionValues[key],
            }),
            response: () => ({
                redirect: (url) => url,
            })
        };
        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);
        const url = await provider.redirect();
        assert.ok(url.includes('https://mock.com/auth?state='));
        assert.ok(sessionValues['socialite_state']);
    });
    (0, node_test_1.it)('validates state correctly', () => {
        const state = 'random-state';
        const request = {
            input: (key) => key === 'state' ? state : null,
            session: () => ({
                get: (key) => key === 'socialite_state' ? state : null,
            })
        };
        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);
        assert.strictEqual(provider.hasValidState(), true);
    });
    (0, node_test_1.it)('fails on invalid state', () => {
        const request = {
            input: (key) => key === 'state' ? 'wrong' : null,
            session: () => ({
                get: (key) => key === 'socialite_state' ? 'correct' : null,
            })
        };
        const provider = new MockProvider(config.providers.google);
        provider.setRequest(request);
        assert.strictEqual(provider.hasValidState(), false);
    });
    (0, node_test_1.it)('can use stateless mode to skip state validation', async () => {
        const provider = new MockProvider(config.providers.google);
        provider.stateless();
        const url = await provider.redirect();
        assert.strictEqual(url, 'https://mock.com/auth?state=');
    });
    (0, node_test_1.it)('facade works correctly', () => {
        const google = src_1.Socialite.driver('google');
        assert.ok(google);
    });
});
//# sourceMappingURL=Socialite.test.js.map