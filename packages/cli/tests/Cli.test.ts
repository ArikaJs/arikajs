
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { Bootstrap } from '../src';

describe('CLI Bootstrap', () => {
    it('boots correctly and returns a CommandRegistry', async () => {
        const registry = await Bootstrap.boot();
        assert.ok(registry !== null);
        assert.strictEqual(typeof registry.run, 'function');
    });
});
