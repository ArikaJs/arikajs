import { Job } from './Contracts';

export class Worker {
    constructor(private driver: any) {
        // In future: Worker will pull from driver
    }

    async process(job: Job) {
        try {
            await job.handle();
        } catch (e: any) {
            throw e;
        }
    }
}
