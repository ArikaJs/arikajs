import { test } from 'node:test';
import assert from 'node:assert';
import { Application } from '../src/application/Application';
import { config } from '@arikajs/config';

test('config(): returns value from repository', () => {
    const app = new Application(__dirname);
    // Manually inject some config for testing
    (app.config() as any).config = {
        app: { name: 'Test App' }
    };

    assert.strictEqual(config('app.name'), 'Test App');
});

test('config(): returns default value if not found', () => {
    new Application(__dirname); // Ensure repo is set
    assert.strictEqual(config('missing', 'default'), 'default');
});

test('Application: make() falls back to config repository', () => {
    const app = new Application(__dirname);
    (app.config() as any).config = {
        services: {
            api: { key: 'secret' }
        }
    };

    // Should resolve via make() using 'config.' prefix
    assert.strictEqual(app.make('config.services.api.key'), 'secret');
});

test('Application: make() prefers container bindings over config fallback', () => {
    const app = new Application(__dirname);
    (app.config() as any).config = {
        app: { name: 'From Config' }
    };

    app.instance('config.app.name', 'From Container');

    assert.strictEqual(app.make('config.app.name'), 'From Container');
});

test('Application: make() throws if token not in container and not in config', () => {
    const app = new Application(__dirname);

    assert.throws(() => {
        app.make('config.missing.key');
    }, /Container: no binding found for token "config.missing.key"/);
});
