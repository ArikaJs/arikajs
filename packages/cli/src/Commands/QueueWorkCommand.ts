
import { Command } from '@arikajs/console';
import { app, Worker } from 'arikajs';

export class QueueWorkCommand extends Command {
    public signature = 'queue:work';
    public description = 'Start processing jobs on the queue as a background worker';

    public async handle() {
        this.info('ArikaJS Queue Worker started...');
        this.info('Press Ctrl+C to stop.');

        const queue: any = app().make('queue');
        const config: any = app().make('config');
        const driverName = this.option('connection') || config.get('queue.default');
        const driver = queue.driver(driverName);

        // Auto-register jobs from app/Jobs directory if possible
        await this.registerJobsFromDirectory();

        const worker = new Worker(driver, {
            queue: this.option('queue') || 'default',
            sleep: parseInt(this.option('sleep') || '3')
        });

        await worker.run();
    }

    protected async registerJobsFromDirectory() {
        const path = require('path');
        const fs = require('fs');
        const jobsDir = path.join(process.cwd(), 'app', 'Jobs');

        if (fs.existsSync(jobsDir)) {
            const files = fs.readdirSync(jobsDir);
            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    const jobName = path.parse(file).name;
                    try {
                        const jobModule = await import(path.join(jobsDir, file));
                        const JobClass = jobModule[jobName] || jobModule.default;
                        if (JobClass) {
                            Worker.registerJob(jobName, JobClass);
                        }
                    } catch (e) {
                        // Skip if cannot import
                    }
                }
            }
        }

        // Also register VerifyEmail if it is used (though technically it is a Mailable, 
        // in ArikaJS mail is often sent via queue using the Mailable itself as a job)
        // For standard jobs, this directory sweep is enough.
    }
}
