
import { DatabaseCommand } from './DatabaseCommand';
import path from 'path';

/**
 * Command to rollback the last database migration batch
 */
export class MigrateRollbackCommand extends DatabaseCommand {
    public signature = 'migrate:rollback';
    public description = 'Rollback the last database migration';

    public async handle() {
        this.info('Rolling back last migration batch...');

        try {
            const { Migrator } = await import('@arikajs/database');
            const db = await this.getDatabaseManager();
            const migrationsPath = path.join(process.cwd(), 'database/migrations');

            const migrator = new Migrator(db, migrationsPath);
            await migrator.rollback();

            await db.closeAll();
            this.info('Rollback sequence completed.');
        } catch (error: any) {
            this.error(`Rollback failed: ${error.message}`);
            process.exit(1);
        }
    }
}
