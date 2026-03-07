
import { Command } from '@arikajs/console';
import { app } from 'arikajs';

export class QueueFailedCommand extends Command {
    public signature = 'queue:failed';
    public description = 'List all of the failed queue jobs';

    public async handle() {
        const db: any = app().make('db');
        const failedJobs = await db.table('failed_jobs').get();

        if (failedJobs.length === 0) {
            this.info('No failed jobs found.');
            return;
        }

        const headers = ['ID', 'Connection', 'Queue', 'Failed At'];
        const rows = failedJobs.map((job: any) => [
            job.id,
            job.connection,
            job.queue,
            new Date(job.failed_at).toLocaleString()
        ]);

        this.table(headers, rows);
    }
}
