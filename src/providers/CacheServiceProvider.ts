import { ServiceProvider } from '@arikajs/foundation';
import { CacheManager, Cache } from '@arikajs/cache';

export class CacheServiceProvider extends ServiceProvider {
    /**
     * Register cache services.
     */
    public async register() {
        this.app.singleton('cache', () => {
            const config = this.app.config().get('cache');
            const database = this.app.make('db');
            const manager = new CacheManager(config, database);

            // Set static access
            Cache.setManager(manager);

            return manager;
        });

        this.app.alias('cache', CacheManager);
    }

    /**
     * Boot cache services.
     */
    public async boot() {
        this.app.make('cache');
    }
}
