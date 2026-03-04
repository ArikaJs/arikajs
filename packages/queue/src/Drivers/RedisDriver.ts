import { Job, QueueDriver } from '../Contracts';
import { Redis, RedisOptions } from 'ioredis';

export interface RedisQueueConfig {
    driver: 'redis';
    connection?: string;
    queue?: string;
    redisConfig?: string | RedisOptions; // allows connection string or options
    client?: Redis; // allows passing a custom connected client or mock
}

export class RedisDriver implements QueueDriver {
    protected redis: Redis;
    protected queueName: string;

    constructor(protected config: RedisQueueConfig) {
        this.queueName = config.queue || 'default';

        if (config.client) {
            this.redis = config.client;
        } else if (typeof config.redisConfig === 'string') {
            this.redis = new Redis(config.redisConfig);
        } else if (typeof config.redisConfig === 'object') {
            this.redis = new Redis(config.redisConfig);
        } else {
            this.redis = new Redis(); // defaults to localhost:6379
        }
    }

    async push(job: Job): Promise<void> {
        const payload = this.createPayload(job);
        await this.redis.rpush(`queues:${this.queueName}`, JSON.stringify(payload));
    }

    protected createPayload(job: Job): any {
        return {
            displayName: job.constructor.name,
            job: job.constructor.name,
            data: this.getJobData(job),
            id: this.generateJobId(),
            attempts: 0,
            createdAt: new Date().toISOString()
        };
    }

    protected getJobData(job: any): any {
        const data: any = {};
        for (const key of Object.keys(job)) {
            data[key] = job[key];
        }
        return data;
    }

    protected generateJobId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Helper method useful for fetching jobs if Worker implements polling later
    async pop(): Promise<any> {
        const result = await this.redis.lpop(`queues:${this.queueName}`);
        return result ? JSON.parse(result) : null;
    }

    // Helper method to clear for tests
    async flush(): Promise<void> {
        await this.redis.del(`queues:${this.queueName}`);
    }

    async close(): Promise<void> {
        await this.redis.quit();
    }
}
