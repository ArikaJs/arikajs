
import { QueueManager } from './QueueManager';
import { Job } from './Contracts';
import { Worker } from './Worker';

export let queueManager: QueueManager;

export class Queue {
    static setManager(manager: QueueManager) {
        queueManager = manager;
    }

    static connection(name: string) {
        return {
            push: (job: Job) => queueManager.push(job, {}, name),
            later: (delay: number | Date, job: Job) => queueManager.later(delay, job, undefined, name),
        };
    }

    static async dispatch(job: Job) {
        if (!queueManager) {
            throw new Error('Queue not configured. Please use Queue.setManager().');
        }
        return queueManager.dispatch(job);
    }

    static async push(job: Job) {
        return queueManager.push(job);
    }

    static async later(delay: number | Date, job: Job) {
        return queueManager.later(delay, job);
    }

    static async bulk(jobs: Job[]) {
        return queueManager.bulk(jobs);
    }
}

export { QueueManager, Job, Worker };
export { BaseJob } from './Job';
export { RedisDriver } from './Drivers/RedisDriver';
