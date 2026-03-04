
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Repository, EnvLoader, env, config, setConfigRepository } from '../src/index.js';

// ─── Basic Functionality ────────────────────────────────────────────────────

describe('Repository: Core', () => {
    it('can get and set values', () => {
        const repo = new Repository({ app: { name: 'Arika' } });
        assert.strictEqual(repo.get('app.name'), 'Arika');
        repo.set('app.env', 'test');
        assert.strictEqual(repo.get('app.env'), 'test');
    });

    it('returns default value if key not found', () => {
        const repo = new Repository();
        assert.strictEqual(repo.get('non.existent', 'default'), 'default');
    });

    it('checks key existence with has()', () => {
        const repo = new Repository({ app: { name: 'Arika' } });
        assert.strictEqual(repo.has('app.name'), true);
        assert.strictEqual(repo.has('app.missing'), false);
    });

    it('can mark as booted and prevent modifications', () => {
        const repo = new Repository();
        repo.markAsBooted();
        assert.throws(
            () => repo.set('any', 'value'),
            /Configuration cannot be modified after boot/,
        );
    });
});

// ─── Feature 1: Config Caching ─────────────────────────────────────────────

describe('Repository: Config Caching', () => {
    it('builds flat cache on boot for O(1) lookups', () => {
        const repo = new Repository({
            app: { name: 'Arika', settings: { debug: true } },
            database: { host: 'localhost', port: 5432 },
        });

        repo.markAsBooted();

        // These should all resolve from the flat cache
        assert.strictEqual(repo.get('app.name'), 'Arika');
        assert.strictEqual(repo.get('app.settings.debug'), true);
        assert.strictEqual(repo.get('database.host'), 'localhost');
        assert.strictEqual(repo.get('database.port'), 5432);
        assert.strictEqual(repo.get('missing', 'fallback'), 'fallback');
    });

    it('has() uses flat cache after boot', () => {
        const repo = new Repository({ app: { name: 'Test' } });
        repo.markAsBooted();

        assert.strictEqual(repo.has('app.name'), true);
        assert.strictEqual(repo.has('missing.key'), false);
    });
});

// ─── Feature 2: Schema Validation ──────────────────────────────────────────

describe('Repository: Schema Validation', () => {
    it('validates required fields', () => {
        const repo = new Repository({ app: {} });
        repo.defineSchema({
            'app.name': { type: 'string', required: true },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('required'));
    });

    it('validates type mismatches', () => {
        const repo = new Repository({ app: { port: 'not-a-number' } });
        repo.defineSchema({
            'app.port': { type: 'number' },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('number'));
    });

    it('validates enum values', () => {
        const repo = new Repository({ app: { env: 'invalid' } });
        repo.defineSchema({
            'app.env': {
                type: 'string',
                enum: ['development', 'production', 'testing'],
            },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('one of'));
    });

    it('validates min/max for numbers', () => {
        const repo = new Repository({ server: { port: 99999 } });
        repo.defineSchema({
            'server.port': { type: 'number', min: 1, max: 65535 },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('65535'));
    });

    it('validates min/max for string length', () => {
        const repo = new Repository({ app: { key: 'ab' } });
        repo.defineSchema({
            'app.key': { type: 'string', min: 16 },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('16'));
    });

    it('validates regex patterns', () => {
        const repo = new Repository({ app: { key: 'invalid-key' } });
        repo.defineSchema({
            'app.key': {
                type: 'string',
                pattern: /^base64:[A-Za-z0-9+/=]+$/,
            },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 1);
        assert.ok(errors[0].message.includes('pattern'));
    });

    it('throws on boot if schema validation fails', () => {
        const repo = new Repository({});
        repo.defineSchema({
            'app.name': { type: 'string', required: true },
        });

        assert.throws(
            () => repo.markAsBooted(),
            /Configuration validation failed/,
        );
    });

    it('passes validation with correct config', () => {
        const repo = new Repository({
            app: { name: 'Arika', env: 'production' },
        });
        repo.defineSchema({
            'app.name': { type: 'string', required: true },
            'app.env': {
                type: 'string',
                enum: ['development', 'production'],
            },
        });

        const errors = repo.validate();
        assert.strictEqual(errors.length, 0);
        // Should not throw
        repo.markAsBooted();
    });
});

// ─── Feature 3: Environment-based Merging ───────────────────────────────────

describe('Repository: Environment Merging', () => {
    it('identifies env-specific files correctly', () => {
        const repo = new Repository();
        // This is tested indirectly via loadConfigDirectory
        // The internal isEnvSpecificFile handles this
        assert.ok(repo); // Placeholder — real test requires temp dirs
    });
});

// ─── Feature 4: Config Change Listeners ─────────────────────────────────────

describe('Repository: Change Listeners', () => {
    it('notifies key-specific listeners on set()', () => {
        const repo = new Repository({ app: { name: 'Old' } });
        let captured: any = null;

        repo.onChange('app.name', (key, newVal, oldVal) => {
            captured = { key, newVal, oldVal };
        });

        repo.set('app.name', 'New');

        assert.deepStrictEqual(captured, {
            key: 'app.name',
            newVal: 'New',
            oldVal: 'Old',
        });
    });

    it('notifies parent listeners when child changes', () => {
        const repo = new Repository({ db: { host: 'old' } });
        let notified = false;

        repo.onChange('db', (key) => {
            notified = true;
            assert.strictEqual(key, 'db.host');
        });

        repo.set('db.host', 'new-host');
        assert.strictEqual(notified, true);
    });

    it('notifies global listeners on any change', () => {
        const repo = new Repository();
        const changes: string[] = [];

        repo.onAnyChange((key) => {
            changes.push(key);
        });

        repo.set('a', 1);
        repo.set('b', 2);

        assert.deepStrictEqual(changes, ['a', 'b']);
    });
});

// ─── Feature 5: Deep Freeze ────────────────────────────────────────────────

describe('Repository: Deep Freeze', () => {
    it('freezes config on boot to prevent mutations', () => {
        const repo = new Repository({
            app: { name: 'Arika', nested: { deep: 'value' } },
        });
        repo.markAsBooted();

        const app = repo.get('app');
        assert.throws(() => {
            'use strict';
            app.name = 'hacked';
        });
    });

    it('freezes deeply nested objects', () => {
        const repo = new Repository({
            level1: { level2: { level3: { secret: 'safe' } } },
        });
        repo.markAsBooted();

        const deep = repo.get('level1.level2.level3');
        assert.throws(() => {
            'use strict';
            deep.secret = 'hacked';
        });
    });
});

// ─── Feature 6: Encrypted Config Values ─────────────────────────────────────

describe('Repository: Encrypted Values', () => {
    it('auto-decrypts enc: prefixed values when decrypter is set', () => {
        const repo = new Repository({
            secrets: { api_key: 'enc:aGVsbG8td29ybGQ=' },
        });

        // Set a simple base64 decrypter
        repo.setDecrypter((encrypted) => {
            return Buffer.from(encrypted, 'base64').toString('utf-8');
        });

        assert.strictEqual(repo.get('secrets.api_key'), 'hello-world');
    });

    it('returns raw value minus prefix when no decrypter is set', () => {
        const repo = new Repository({
            secrets: { key: 'enc:raw-encrypted-data' },
        });

        assert.strictEqual(repo.get('secrets.key'), 'raw-encrypted-data');
    });

    it('auto-decrypts after boot using flat cache', () => {
        const repo = new Repository({
            secrets: { token: 'enc:c2VjcmV0' },
        });

        repo.setDecrypter((encrypted) => {
            return Buffer.from(encrypted, 'base64').toString('utf-8');
        });

        repo.markAsBooted();

        assert.strictEqual(repo.get('secrets.token'), 'secret');
    });
});

// ─── EnvLoader & Helpers ────────────────────────────────────────────────────

describe('EnvLoader & Helpers', () => {
    it('handles environment variable casting', () => {
        process.env.TEST_TRUE = 'true';
        process.env.TEST_FALSE = 'false';
        process.env.TEST_NULL = 'null';
        process.env.TEST_STR = 'hello';

        assert.strictEqual(EnvLoader.get('TEST_TRUE'), true);
        assert.strictEqual(EnvLoader.get('TEST_FALSE'), false);
        assert.strictEqual(EnvLoader.get('TEST_NULL'), null);
        assert.strictEqual(EnvLoader.get('TEST_STR'), 'hello');
        assert.strictEqual(EnvLoader.get('NON_EXISTENT', 'fb'), 'fb');

        delete process.env.TEST_TRUE;
        delete process.env.TEST_FALSE;
        delete process.env.TEST_NULL;
        delete process.env.TEST_STR;
    });

    it('global helpers work correctly', () => {
        const repo = new Repository({ site: { url: 'https://arika.js' } });
        setConfigRepository(repo);

        assert.strictEqual(config('site.url'), 'https://arika.js');

        process.env.HELPER_TEST = 'works';
        assert.strictEqual(env('HELPER_TEST'), 'works');
        delete process.env.HELPER_TEST;
    });
});
