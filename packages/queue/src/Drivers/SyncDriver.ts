
import { Job, QueueDriver } from '../Contracts';

export class SyncDriver implements QueueDriver {
    async push(job: Job, options?: { queue?: string; delay?: number | Date }): Promise<void> {
        // Sync driver executes immediately
        try {
            await job.handle();
        } catch (error) {
            console.error('Job failed:', error);
            throw error; // Or handle failure policy
        }
    }

    async pop(queue?: string): Promise<any | null> {
        return null; // Sync doesn't support popping as it's immediate
    }

    async acknowledge(jobData: any): Promise<void> {
        // Nothing to do for sync
    }

    async fail(jobData: any, error: any): Promise<void> {
        // Log and throw for sync
        console.error('Sync job failed:', error);
    }
}
