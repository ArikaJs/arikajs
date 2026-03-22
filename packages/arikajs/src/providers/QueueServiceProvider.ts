import { ServiceProvider } from '@arikajs/foundation';
import { QueueManager, Queue, Worker } from '@arikajs/queue';
import { SendQueuedMailable } from '@arikajs/mail';

export class QueueServiceProvider extends ServiceProvider {
    /**
     * Register queue services.
     */
    public async register() {
        // Register framework internal jobs
        Worker.registerJob('SendQueuedMailable', SendQueuedMailable);
        this.app.singleton('queue', () => {
            const config = this.app.config().get('queue');
            const database = this.app.make('db');
            const manager = new QueueManager(config, database);

            // Set static access
            Queue.setManager(manager);

            return manager;
        });

        this.app.alias('queue', QueueManager);
    }

    /**
     * Boot queue services.
     */
    public async boot() {
        this.app.make('queue');
    }
}
