
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Command, CommandRegistry } from '../src';

class RichCommand extends Command {
    signature = 'test:rich';
    description = 'Test rich output';

    async handle() {
        this.success('Operation completed');
        this.table(['ID', 'Name'], [[1, 'Arika'], [2, 'Console']]);
        return true;
    }
}

describe('Console Enhancements', () => {
    it('supports success and table output', async () => {
        const registry = new CommandRegistry();
        registry.register(RichCommand);

        const result = await registry.run(['test:rich']);
        assert.strictEqual(result, true);
    });

    it('can execute tasks', async () => {
        class TaskCommand extends Command {
            signature = 'test:task';
            description = 'test task';
            async handle() {
                return await this.task('Running task', () => 'done');
            }
        }

        const registry = new CommandRegistry();
        registry.register(TaskCommand);
        const result = await registry.run(['test:task']);
        assert.strictEqual(result, 'done');
    });

    it('supports default values in signatures', async () => {
        class DefaultCommand extends Command {
            signature = 'test:default {name=Arika} {--mode=silent}';
            description = 'test defaults';
            handle() {
                return {
                    name: this.argument('name'),
                    mode: this.option('mode')
                };
            }
        }

        const registry = new CommandRegistry();
        registry.register(DefaultCommand);

        const result = await registry.run(['test:default']);
        assert.deepStrictEqual(result, { name: 'Arika', mode: 'silent' });
    });
});
