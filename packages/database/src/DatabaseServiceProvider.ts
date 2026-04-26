import { ServiceProvider } from '@arikajs/foundation';
import { Database } from './Database';
import { DatabaseManager } from './DatabaseManager';
import { DatabaseValidation } from './Validation/DatabaseValidation';

export class DatabaseServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public register(): void {
        this.app.singleton(DatabaseManager, () => {
            const config = this.app.make('config').get('database');
            return new DatabaseManager(config);
        });

        this.app.singleton(Database, () => {
            return this.app.make(DatabaseManager).connection();
        });

        // Initialize Facade
        this.app.make(DatabaseManager); 
        Database.setManager(this.app.make(DatabaseManager));
        
        // Alias
        this.app.alias(Database, 'db');
    }

    /**
     * Bootstrap any application services.
     */
    public boot(): void {
        DatabaseValidation.register();
    }
}
