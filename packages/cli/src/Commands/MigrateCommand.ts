
import { DatabaseCommand } from './DatabaseCommand';
import path from 'path';

/**
 * Command to run database migrations
 */
export class MigrateCommand extends DatabaseCommand {
    public signature = 'migrate';
    public description = 'Run the database migrations';

    public async handle() {
        this.info('Running migrations...');

        try {
            const { Migrator } = await import('@arikajs/database');
            const db = await this.getDatabaseManager();
            const migrationsPath = path.join(process.cwd(), 'database/migrations');

            const migrator = new Migrator(db, migrationsPath);
            await migrator.migrate();

            await db.closeAll();
            this.info('Migration sequence completed.');
        } catch (error: any) {
            this.error(`Migration failed: ${error.message}`);
            process.exit(1);
        }
    }
}
