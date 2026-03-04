
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { Command, CommandRegistry } from '../src';

class TestCommand extends Command {
    signature = 'test:run {name} {--shout}';
    description = 'A test command';

    async handle() {
        const name = this.argument('name');
        const shout = this.option('shout');

        const message = shout ? `HELLO ${name.toUpperCase()}!` : `Hello ${name}`;

        this.info(message);
        return message;
    }
}

describe('Console', () => {
    it('registers and executes a command', async () => {
        const registry = new CommandRegistry();
        registry.register(TestCommand);

        const result = await registry.run(['test:run', 'arika']);
        assert.strictEqual(result, 'Hello arika');
    });

    it('handles options correctly', async () => {
        const registry = new CommandRegistry();
        registry.register(TestCommand);

        const result = await registry.run(['test:run', 'arika', '--shout']);
        assert.strictEqual(result, 'HELLO ARIKA!');
    });

    it('throws error for unknown command', async () => {
        const registry = new CommandRegistry();

        await assert.rejects(
            async () => await registry.run(['unknown']),
            /Command "unknown" not found/
        );
    });

    it('calls the initialize hook before handle', async () => {
        let initialized = false;
        class InitCommand extends Command {
            signature = 'init';
            description = 'test init';
            initialize() { initialized = true; }
            handle() { return 'done'; }
        }

        const registry = new CommandRegistry();
        registry.register(InitCommand);
        await registry.run(['init']);

        assert.ok(initialized, 'initialize should have been called');
    });

    it('supports custom resolver for dependency injection', async () => {
        class DiCommand extends Command {
            signature = 'di';
            description = 'test di';
            constructor(public service: string) { super(); }
            handle() { return this.service; }
        }

        const registry = new CommandRegistry((cls) => {
            if (cls === DiCommand) return new DiCommand('injected-service');
            return new cls();
        });

        registry.register(DiCommand);
        const result = await registry.run(['di']);

        assert.strictEqual(result, 'injected-service');
    });
});
