
import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Cache, CacheManager } from '../src';

describe('Cache', () => {
    before(() => {
        const config = {
            default: 'memory',
            stores: {
                memory: {
                    driver: 'memory'
                }
            }
        };

        const manager = new CacheManager(config);
        Cache.setManager(manager);
    });

    it('can put and get values from cache', async () => {
        await Cache.put('test-key', 'test-value', 10);
        const value = await Cache.get('test-key');
        assert.strictEqual(value, 'test-value');
    });

    it('returns null for expired values', async () => {
        await Cache.put('expired-key', 'expired-value', -1); // expired immediately
        const value = await Cache.get('expired-key');
        assert.strictEqual(value, null);
    });

    it('can use remember to fetch and store values', async () => {
        let called = 0;
        const callback = async () => {
            called++;
            return 'remembered-value';
        };

        const value1 = await Cache.remember('remember-key', 10, callback);
        assert.strictEqual(value1, 'remembered-value');
        assert.strictEqual(called, 1);

        const value2 = await Cache.remember('remember-key', 10, callback);
        assert.strictEqual(value2, 'remembered-value');
        assert.strictEqual(called, 1); // should not be called again
    });

    it('can forget values', async () => {
        await Cache.put('forget-key', 'value', 10);
        await Cache.forget('forget-key');
        const value = await Cache.get('forget-key');
        assert.strictEqual(value, null);
    });

    it('can increment and decrement values', async () => {
        await Cache.put('counter', 10, 10);
        await Cache.increment('counter', 5);
        assert.strictEqual(await Cache.get('counter'), 15);
        await Cache.decrement('counter', 3);
        assert.strictEqual(await Cache.get('counter'), 12);
    });

    it('can pull values (get and forget)', async () => {
        await Cache.put('pull-key', 'pull-value', 10);
        const value = await Cache.pull('pull-key');
        assert.strictEqual(value, 'pull-value');
        assert.strictEqual(await Cache.get('pull-key'), null);
    });

    it('can add values only if they do not exist', async () => {
        await Cache.put('exists', 'value', 10);
        const added1 = await Cache.add('exists', 'new-value', 10);
        assert.strictEqual(added1, false);
        assert.strictEqual(await Cache.get('exists'), 'value');

        const added2 = await Cache.add('new', 'value', 10);
        assert.strictEqual(added2, true);
        assert.strictEqual(await Cache.get('new'), 'value');
    });

    it('can remember values forever', async () => {
        await Cache.rememberForever('forever-key', async () => 'forever-value');
        assert.strictEqual(await Cache.get('forever-key'), 'forever-value');
    });

    // ── Enterprise Features ─────────────────────────────────────────

    it('can put, get, and forget multiple values', async () => {
        await Cache.putMultiple({ 'm1': 'v1', 'm2': 'v2' }, 10);

        const results = await Cache.getMultiple(['m1', 'm2', 'm3']);
        assert.strictEqual(results['m1'], 'v1');
        assert.strictEqual(results['m2'], 'v2');
        assert.strictEqual(results['m3'], null);

        await Cache.forgetMultiple(['m1', 'm2']);
        const afterForget = await Cache.getMultiple(['m1', 'm2']);
        assert.strictEqual(afterForget['m1'], null);
    });

    it('can use cache locks', async () => {
        const lock = Cache.lock('test-lock', 10);

        const acquired = await lock.acquire();
        assert.strictEqual(acquired, true);

        // Second lock attempt shouldn't succeed
        const lock2 = Cache.lock('test-lock', 10);
        assert.strictEqual(await lock2.acquire(), false);

        await lock.release();

        // After release, should succeed
        assert.strictEqual(await lock2.acquire(), true);
        await lock2.release();
    });

    it('can execute callbacks safely using lock.get()', async () => {
        const lock = Cache.lock('callback-lock', 10);
        let executed = false;

        const result = await lock.get(async () => {
            executed = true;
            return 'done';
        });

        assert.strictEqual(result, 'done');
        assert.strictEqual(executed, true);

        // Lock should be released automatically, so this will work:
        assert.strictEqual(await lock.acquire(), true);
        await lock.release();
    });

    it('can tag and flush specific groups', async () => {
        const usersCache = Cache.tags(['users']);
        const postsCache = Cache.tags(['posts']);

        await usersCache.put('u1', 'user info', 10);
        await postsCache.put('p1', 'post info', 10);

        assert.strictEqual(await usersCache.get('u1'), 'user info');
        assert.strictEqual(await postsCache.get('p1'), 'post info');

        // Flush ONLY users cache
        await usersCache.flush();

        assert.strictEqual(await usersCache.get('u1'), null);
        assert.strictEqual(await postsCache.get('p1'), 'post info'); // posts intact
    });
});
