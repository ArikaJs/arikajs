
import { Store } from '../Contracts/Store';
import Redis, { Cluster, RedisOptions } from 'ioredis';

export class RedisDriver implements Store {
    protected redis: Redis | Cluster;

    constructor(config: any, protected prefix: string = '') {
        const mode = config.mode || 'standalone';

        if (mode === 'cluster') {
            this.redis = new Redis.Cluster(config.nodes, {
                redisOptions: {
                    password: config.password,
                    ...config.options
                }
            });
        } else if (mode === 'sentinel') {
            this.redis = new Redis({
                sentinels: config.nodes,
                name: config.name,
                password: config.password,
                db: config.database,
                ...config.options
            });
        } else {
            this.redis = new Redis({
                host: config.host,
                port: config.port,
                password: config.password,
                db: config.database,
                ...config.options
            });
        }
    }

    public async get(key: string): Promise<any> {
        const value = await this.redis.get(this.prefix + key);
        return value ? JSON.parse(value) : null;
    }

    public async put(key: string, value: any, seconds: number): Promise<void> {
        const serializedValue = JSON.stringify(value);
        if (seconds > 0) {
            await this.redis.set(this.prefix + key, serializedValue, 'EX', seconds);
        } else {
            await this.forever(key, value);
        }
    }

    public async increment(key: string, value: number = 1): Promise<number> {
        return await this.redis.incrby(this.prefix + key, value);
    }

    public async decrement(key: string, value: number = 1): Promise<number> {
        return await this.redis.decrby(this.prefix + key, value);
    }

    public async forever(key: string, value: any): Promise<void> {
        await this.redis.set(this.prefix + key, JSON.stringify(value));
    }

    public async forget(key: string): Promise<void> {
        await this.redis.del(this.prefix + key);
    }

    public async flush(): Promise<void> {
        await this.redis.flushdb();
    }

    public async add(key: string, value: any, seconds: number): Promise<boolean> {
        const serializedValue = JSON.stringify(value);
        let result;
        if (seconds > 0) {
            result = await this.redis.set(this.prefix + key, serializedValue, 'EX', seconds, 'NX');
        } else {
            result = await this.redis.set(this.prefix + key, serializedValue, 'NX');
        }
        return result === 'OK';
    }

    public async getMultiple(keys: string[]): Promise<Record<string, any>> {
        if (keys.length === 0) return {};
        const prefixedKeys = keys.map(k => this.prefix + k);
        const values = await this.redis.mget(...prefixedKeys);

        const result: Record<string, any> = {};
        for (let i = 0; i < keys.length; i++) {
            result[keys[i]] = values[i] ? JSON.parse(values[i] as string) : null;
        }
        return result;
    }

    public async putMultiple(values: Record<string, any>, seconds: number): Promise<void> {
        if (Object.keys(values).length === 0) return;

        if (seconds > 0) {
            const pipeline = this.redis.pipeline();
            for (const [key, value] of Object.entries(values)) {
                pipeline.set(this.prefix + key, JSON.stringify(value), 'EX', seconds);
            }
            await pipeline.exec();
        } else {
            const multiValues: Record<string, string> = {};
            for (const [key, value] of Object.entries(values)) {
                multiValues[this.prefix + key] = JSON.stringify(value);
            }
            await this.redis.mset(multiValues);
        }
    }

    public async forgetMultiple(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        const prefixedKeys = keys.map(k => this.prefix + k);
        await this.redis.del(...prefixedKeys);
    }

    public getPrefix(): string {
        return this.prefix;
    }

    /**
     * Get the underlying Redis instance.
     */
    public getRedis(): Redis | Cluster {
        return this.redis;
    }
}
