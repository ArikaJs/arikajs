
import { Command } from '@arikajs/console';
import { app } from 'arikajs';

export class CacheClearCommand extends Command {
    public signature = 'cache:clear {store?}';
    public description = 'Flush the application cache';

    public async handle() {
        const store = this.argument('store');
        const cache: any = app().make('cache');

        try {
            if (store) {
                this.info(`Clearing cache store: ${store}...`);
                await cache.store(store).flush();
            } else {
                this.info('Clearing default cache store...');
                await cache.flush();
            }

            this.success('Application cache cleared successfully!');
        } catch (error: any) {
            this.error('Failed to clear cache:');
            console.error(error);
        }
    }
}
