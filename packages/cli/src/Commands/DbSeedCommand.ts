
import { DatabaseCommand } from './DatabaseCommand';
import path from 'path';

/**
 * Command to seed the database
 */
export class DbSeedCommand extends DatabaseCommand {
    public signature = 'db:seed {--class=}';
    public description = 'Seed the database with records';

    public async handle() {
        const seederClass = this.option('class');

        this.info(seederClass ? `Seeding: ${seederClass}` : 'Running database seeders...');

        try {
            const { SeedRunner } = await import('@arikajs/database');
            const db = await this.getDatabaseManager();
            const seedersPath = path.join(process.cwd(), 'database/seeders');

            const runner = new SeedRunner(db, seedersPath);
            await runner.run(seederClass);

            await db.closeAll();
            this.info('Seeding completed.');
        } catch (error: any) {
            this.error(`Seeding failed: ${error.message}`);
            process.exit(1);
        }
    }
}
