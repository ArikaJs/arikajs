
import { QueueManager } from './QueueManager';
import { Job } from './Contracts';
// import { Worker } from './Worker'; // Not exposed in README usage but internally used

export let queueManager: QueueManager;

export class Queue {
    static setManager(manager: QueueManager) {
        queueManager = manager;
    }

    static async dispatch(job: Job) {
        if (!queueManager) {
            throw new Error('Queue not configured. Please use Queue.setManager().');
        }
        return queueManager.dispatch(job);
    }
}

export { QueueManager, Job };
export { BaseJob } from './Job';
export { RedisDriver } from './Drivers/RedisDriver';
