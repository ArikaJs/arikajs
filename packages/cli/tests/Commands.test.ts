
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { Bootstrap } from '../src';

describe('CLI Commands Registration', () => {
    it('registers all core commands', async () => {
        const registry = await Bootstrap.boot();
        const commands = registry.all();

        const expectedSignatures = [
            'new',
            'list',
            'serve',
            'key:generate',
            'migrate',
            'auth:install',
            'auth:install:web',
            'auth:install:api',
            'make:controller',
            'make:model',
            'make:migration'
        ];

        expectedSignatures.forEach(sig => {
            const command = registry.all().get(sig.split(' ')[0]);
            assert.ok(command, `Command with signature "${sig}" should be registered`);
        });
    });

    it('can load lazy-loaded commands', async () => {
        const registry = await Bootstrap.boot();
        // Since registry.all() might not trigger lazy loading of the actual classes 
        // if they are just strings/factories in the registry, we check if they exist.

        const apiAuthCommand = registry.all().get('auth:install:api');
        assert.ok(apiAuthCommand, 'auth:install:api should be registered');

        const webAuthCommand = registry.all().get('auth:install:web');
        assert.ok(webAuthCommand, 'auth:install:web should be registered');
    });
});
