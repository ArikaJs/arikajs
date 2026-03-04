import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { QueueManager, BaseJob } from '../src';
import { RedisDriver } from '../src/Drivers/RedisDriver';

class DummyRedis {
    public data: Map<string, string[]> = new Map();

    async rpush(key: string, value: string) {
        if (!this.data.has(key)) {
            this.data.set(key, []);
        }
        this.data.get(key)!.push(value);
        return this.data.get(key)!.length;
    }

    async llen(key: string) {
        return this.data.get(key)?.length || 0;
    }

    async lrange(key: string, start: number, stop: number) {
        const list = this.data.get(key) || [];
        return stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
    }

    async lpop(key: string) {
        const list = this.data.get(key);
        if (!list || list.length === 0) return null;
        return list.shift();
    }

    async del(key: string) {
        this.data.delete(key);
    }

    async quit() { }
}

class RedisTestJob extends BaseJob {
    constructor(public email: string) {
        super();
    }
    async handle() { }
}

describe('Redis Queue Driver', () => {
    let manager: QueueManager;
    let mockRedis: DummyRedis;

    before(() => {
        mockRedis = new DummyRedis();

        const config = {
            default: 'redis',
            connections: {
                redis: {
                    driver: 'redis',
                    queue: 'test_queue',
                    client: mockRedis as any
                }
            }
        };

        manager = new QueueManager(config);
    });

    after(async () => {
        const driver = manager.driver('redis') as RedisDriver;
        await driver.flush();
    });

    it('can push job to redis list', async () => {
        const driver = manager.driver('redis') as RedisDriver;
        await driver.flush();

        await manager.dispatch(new RedisTestJob('test@example.com'));

        const length = await mockRedis.llen('queues:test_queue');
        assert.strictEqual(length, 1);

        const jobJson = await mockRedis.lrange('queues:test_queue', 0, -1);
        assert.ok(jobJson.length > 0);

        const payload = JSON.parse(jobJson[0]);
        assert.strictEqual(payload.displayName, 'RedisTestJob');
        assert.strictEqual(payload.data.email, 'test@example.com');
        assert.ok(payload.id !== undefined);
    });
});
