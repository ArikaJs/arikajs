
import { Job } from './Contracts';

// Base class for Jobs if users prefer inheritance
export abstract class BaseJob implements Job {
    public connection?: string;
    public queue?: string;
    public delay?: number | Date;
    public tries?: number;
    public timeout?: number;

    abstract handle(): Promise<void> | void;

    public onConnection(connection: string): this {
        this.connection = connection;
        return this;
    }

    public onQueue(queue: string): this {
        this.queue = queue;
        return this;
    }

    public onDelay(delay: number | Date): this {
        this.delay = delay;
        return this;
    }
}
