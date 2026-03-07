
import { Command } from '@arikajs/console';
import { app } from 'arikajs';

export class QueueFlushCommand extends Command {
    public signature = 'queue:flush';
    public description = 'Flush all of the failed queue jobs';

    public async handle() {
        if (await this.confirm('Are you sure you want to flush all failed jobs?')) {
            const db: any = app().make('db');
            await db.table('failed_jobs').delete();
            this.success('All failed jobs have been deleted.');
        }
    }
}
