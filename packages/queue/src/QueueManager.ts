
import { Job, QueueDriver } from './Contracts';
import { SyncDriver } from './Drivers/SyncDriver';
import { DatabaseDriver } from './Drivers/DatabaseDriver';
import { RedisDriver } from './Drivers/RedisDriver';

export class QueueManager {
    private drivers: Map<string, QueueDriver> = new Map();
    private config: any;
    private database: any;

    constructor(config: any, database?: any) {
        this.config = config;
        this.database = database;
    }

    public driver(name?: string): QueueDriver {
        const driverName = name || this.config.default;

        if (!this.drivers.has(driverName)) {
            this.drivers.set(driverName, this.resolve(driverName));
        }

        return this.drivers.get(driverName)!;
    }

    protected resolve(name: string): QueueDriver {
        const config = this.config.connections[name];

        if (!config) {
            throw new Error(`Queue connection [${name}] not configured.`);
        }

        switch (config.driver) {
            case 'sync':
                return new SyncDriver();
            case 'database':
                return new DatabaseDriver(this.database, config);
            case 'redis':
                return new RedisDriver(config);
            default:
                throw new Error(`Unsupported queue driver [${config.driver}].`);
        }
    }

    public async push(job: Job, options?: { queue?: string; delay?: number | Date }, connection?: string) {
        return this.driver(connection || job.connection).push(job, options);
    }

    public async later(delay: number | Date, job: Job, queue?: string, connection?: string) {
        return this.push(job, { delay, queue }, connection);
    }

    public async dispatch(job: Job, connection?: string) {
        return this.push(job, {
            queue: job.queue,
            delay: job.delay
        }, connection || job.connection);
    }

    public async bulk(jobs: Job[], connection?: string) {
        return Promise.all(jobs.map(job => this.dispatch(job, connection)));
    }
}
