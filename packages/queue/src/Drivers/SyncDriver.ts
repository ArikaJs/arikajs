
import { Job, QueueDriver } from '../Contracts';

export class SyncDriver implements QueueDriver {
    async push(job: Job): Promise<void> {
        // Sync driver executes immediately
        try {
            await job.handle();
        } catch (error) {
            console.error('Job failed:', error);
            throw error; // Or handle failure policy
        }
    }
}
