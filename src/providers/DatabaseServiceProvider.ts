
import { ServiceProvider } from '@arikajs/foundation';
import { DatabaseManager, Database } from '@arikajs/database';

export class DatabaseServiceProvider extends ServiceProvider {
    /**
     * Register the database services.
     */
    public async register() {
        this.app.singleton('db', () => {
            const config = this.app.config().get('database');

            if (!config) {
                // If no config provided, we'll use a default memory sqlite for convenience
                // though usually this should throw in production.
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

        this.app.bind(DatabaseManager, () => this.app.resolve('db'));
    }

    /**
     * Boot the database services.
     */
    public async boot() {
        // Initialize the static Database facade
        Database.setManager(this.app.resolve(DatabaseManager));
    }
}
