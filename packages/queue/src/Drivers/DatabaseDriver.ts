
import { Job, QueueDriver } from '../Contracts';

export interface DatabaseQueueConfig {
    driver: 'database';
    table: string;
    connection?: string;
}

export class DatabaseDriver implements QueueDriver {
    constructor(
        private database: any,
        private config: DatabaseQueueConfig
    ) { }

    async push(job: Job, options: { queue?: string; delay?: number | Date } = {}): Promise<void> {
        const payload = this.createPayload(job);
        const queue = options.queue || job.queue || 'default';
        let availableAt = Math.floor(Date.now() / 1000);

        if (options.delay) {
            if (options.delay instanceof Date) {
                availableAt = Math.floor(options.delay.getTime() / 1000);
            } else {
                availableAt += options.delay;
            }
        }

        await this.database.table(this.config.table, this.config.connection).insert({
            queue: queue,
            payload: JSON.stringify(payload),
            attempts: 0,
            available_at: availableAt,
            created_at: Math.floor(Date.now() / 1000),
        });
    }

    async pop(queue: string = 'default'): Promise<any | null> {
        const now = Math.floor(Date.now() / 1000);

        // Find the next available job
        const job = await this.database.table(this.config.table, this.config.connection)
            .where('queue', queue)
            .where('available_at', '<=', now)
            .whereNull('reserved_at')
            .orderBy('available_at', 'asc')
            .first();

        if (!job) {
            return null;
        }

        // Reserve the job
        await this.database.table(this.config.table, this.config.connection)
            .where('id', job.id)
            .update({
                reserved_at: now,
                attempts: job.attempts + 1
            });

        return {
            id: job.id,
            payload: JSON.parse(job.payload),
            attempts: job.attempts + 1
        };
    }

    async acknowledge(jobData: any): Promise<void> {
        await this.database.table(this.config.table, this.config.connection)
            .where('id', jobData.id)
            .delete();
    }

    async fail(jobData: any, error: any): Promise<void> {
        const failedTable = 'failed_jobs';

        await this.database.table(failedTable, this.config.connection).insert({
            uuid: Math.random().toString(36).substring(2),
            connection: this.config.connection || 'default',
            queue: jobData.queue || 'default',
            payload: JSON.stringify(jobData.payload),
            exception: error.stack || error.message,
            failed_at: new Date()
        });

        await this.acknowledge(jobData);
    }

    protected createPayload(job: Job): any {
        return {
            displayName: job.constructor.name,
            job: job.constructor.name,
            data: this.getJobData(job),
        };
    }

    protected getJobData(job: any): any {
        // Simple serialization of job properties
        const data: any = {};
        for (const key of Object.keys(job)) {
            // Avoid serializing functions or complex objects
            if (typeof job[key] !== 'function') {
                data[key] = job[key];
            }
        }
        return data;
    }
}
