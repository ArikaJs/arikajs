
import { Command } from '@arikajs/console';
import { app } from 'arikajs';

export class QueueRetryCommand extends Command {
    public signature = 'queue:retry {id}';
    public description = 'Retry a failed queue job';

    public async handle() {
        const id = this.argument('id');
        const db: any = app().make('db');
        const config: any = app().make('config');

        const failedJob = await db.table('failed_jobs').where('id', id).first();

        if (!failedJob) {
            this.error(`Failed job with ID [${id}] not found.`);
            return;
        }

        const jobsTable = config.get('queue.connections.database.table', 'jobs');

        // Re-insert into active jobs table
        await db.table(jobsTable).insert({
            queue: failedJob.queue,
            payload: failedJob.payload,
            attempts: 0,
            available_at: Math.floor(Date.now() / 1000),
            created_at: Math.floor(Date.now() / 1000),
        });

        // Delete from failed jobs
        await db.table('failed_jobs').where('id', id).delete();

        this.success(`The failed job [${id}] has been pushed back onto the queue.`);
    }
}
