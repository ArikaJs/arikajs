
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

    async push(job: Job): Promise<void> {
        const payload = this.createPayload(job);

        await this.database.table(this.config.table).insert({
            queue: 'default',
            payload: JSON.stringify(payload),
            attempts: 0,
            available_at: new Date(),
            created_at: new Date(),
        });
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
            data[key] = job[key];
        }
        return data;
    }
}
