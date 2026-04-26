
import { ServiceProvider } from '@arikajs/foundation';
import { DatabaseManager, Database } from '@arikajs/database';

export class DatabaseServiceProvider extends ServiceProvider {
    /**
     * Register the database services.
     */
    public async register() {
        this.app.singleton(DatabaseManager, () => {
            const config = this.app.config().get('database');

            if (!config) {
                return new DatabaseManager({
                    default: 'sqlite',
                    connections: {
                        sqlite: {
                            driver: 'sqlite',
                            database: ':memory:'
                        }
                    }
                } as any);
            }

            return new DatabaseManager(config as any);
        });

        this.app.singleton(Database, () => {
            return this.app.make(DatabaseManager).connection();
        });

        this.app.alias(Database, 'db');
    }

    /**
     * Boot the database services.
     */
    public async boot() {
        // Initialize the static Database facade
        const dbManager = this.app.resolve(DatabaseManager);
        Database.setManager(dbManager);

        // Register caching for query builder
        if (this.app.getContainer().has('cache')) {
            dbManager.setCache(this.app.resolve('cache'));
        }
    }
}
