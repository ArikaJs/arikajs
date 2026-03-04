
import { Scheduler } from './Scheduler';
import { Log } from '@arikajs/logging';

export class Worker {
    protected stopped: boolean = false;
    protected running: boolean = false;

    constructor(protected scheduler: Scheduler) { }

    /**
     * Start the scheduler worker.
     */
    public async start() {
        Log.info('Scheduler worker started. Press Ctrl+C to stop.');

        // Graceful shutdown
        const shutdown = () => {
            this.stopped = true;
            Log.info('Stopping scheduler worker gracefully...');
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        while (!this.stopped) {
            const now = new Date();
            // Round down to the minute
            now.setSeconds(0, 0);

            this.running = true;
            await this.scheduler.run(now);
            this.running = false;

            if (this.stopped) break;

            // Wait until the next minute
            const waitTime = 60000 - (Date.now() % 60000);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        Log.info('Scheduler worker stopped.');
    }
}
