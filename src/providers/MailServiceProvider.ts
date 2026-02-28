import { ServiceProvider } from '@arikajs/foundation';
import { MailManager, Mail } from '@arikajs/mail';

export class MailServiceProvider extends ServiceProvider {
    /**
     * Register mail services.
     */
    public async register() {
        this.app.singleton('mail.manager', () => {
            const config = this.app.config().get('mail');
            const view = this.app.make('view');
            const queue = this.app.make('queue');

            const manager = new MailManager(config, view);
            manager.setQueue(queue);

            // Set static access
            Mail.setManager(manager);

            return manager;
        });

        this.app.alias('mail.manager', MailManager);
    }

    /**
     * Boot mail services.
     */
    public async boot() {
        this.app.make('mail.manager');
    }
}
