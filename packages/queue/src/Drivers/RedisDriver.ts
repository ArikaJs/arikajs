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

    async push(job: Job, options: { queue?: string; delay?: number | Date } = {}): Promise<void> {
        const payload = this.createPayload(job);
        const queue = options.queue || job.queue || this.queueName;
        const json = JSON.stringify(payload);

        if (options.delay) {
            let availableAt = Math.floor(Date.now() / 1000);
            if (options.delay instanceof Date) {
                availableAt = Math.floor(options.delay.getTime() / 1000);
            } else {
                availableAt += options.delay;
            }
            await this.redis.zadd(`queues:${queue}:delayed`, availableAt, json);
        } else {
            await this.redis.rpush(`queues:${queue}`, json);
        }
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
    async pop(queue?: string): Promise<any> {
        const queueName = queue || this.queueName;
        // First try to move delayed jobs that are now available
        await this.migrateDelayedJobs(queueName);

        const result = await this.redis.lpop(`queues:${queueName}`);
        return result ? JSON.parse(result) : null;
    }

    protected async migrateDelayedJobs(queue: string) {
        const now = Math.floor(Date.now() / 1000);
        const delayedKey = `queues:${queue}:delayed`;
        const jobs = await this.redis.zrangebyscore(delayedKey, 0, now);

        if (jobs.length > 0) {
            await this.redis.zremrangebyscore(delayedKey, 0, now);
            for (const job of jobs) {
                await this.redis.rpush(`queues:${queue}`, job);
            }
        }
    }

    async acknowledge(jobData: any): Promise<void> {
        // Redis lpop already removed the job, but we could implement ack for RPOPPLPUSH if needed
    }

    async fail(jobData: any, error: any): Promise<void> {
        const failedKey = `queues:failed`;
        await this.redis.rpush(failedKey, JSON.stringify({
            ...jobData,
            exception: error.stack || error.message,
            failedAt: new Date().toISOString()
        }));
    }

    // Helper method to clear for tests
    async flush(): Promise<void> {
        await this.redis.del(`queues:${this.queueName}`);
    }

    async close(): Promise<void> {
        await this.redis.quit();
    }
}
