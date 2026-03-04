import { DatabaseCommand } from './DatabaseCommand';
import path from 'path';

/**
 * Command to drop all tables and re-run all migrations
 */
export class MigrateFreshCommand extends DatabaseCommand {
    public signature = 'migrate:fresh {--seed}';
    public description = 'Drop all tables and re-run all migrations';

    public async handle() {
        this.writeln('');
        this.info(' 🔄 Refreshing database: dropping all tables...');

        try {
            const db = await this.getDatabaseManager();
            const connection = await db.connection();
            const grammar = connection.getSchemaGrammar().constructor.name;

            let tables: string[] = [];

            // Fetch table names based on driver
            if (grammar === 'MySQLGrammar') {
                const results = await connection.query('SHOW TABLES');
                if (results.length > 0) {
                    const key = Object.keys(results[0])[0];
                    tables = results.map((r: any) => r[key]);
                }
            } else if (grammar === 'PostgreSQLGrammar') {
                const results = await connection.query(
                    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
                );
                tables = results.map((r: any) => r.tablename);
            } else if (grammar === 'SQLiteGrammar') {
                const results = await connection.query(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                );
                tables = results.map((r: any) => r.name);
            }

            if (tables.length > 0) {
                // Disable foreign key checks
                if (grammar === 'MySQLGrammar') await connection.query('SET FOREIGN_KEY_CHECKS = 0');
                if (grammar === 'SQLiteGrammar') await connection.query('PRAGMA foreign_keys = OFF');

                for (const table of tables) {
                    this.comment(`   Dropping table: ${table}`);
                    if (grammar === 'PostgreSQLGrammar') {
                        // Use CASCADE for Postgres to handle dependencies
                        await connection.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
                    } else {
                        await db.schema().dropIfExists(table);
                    }
                }

                // Re-enable foreign key checks
                if (grammar === 'MySQLGrammar') await connection.query('SET FOREIGN_KEY_CHECKS = 1');
                if (grammar === 'SQLiteGrammar') await connection.query('PRAGMA foreign_keys = ON');

                this.success(`  ✅ Dropped ${tables.length} tables.`);
            } else {
                this.comment('  ℹ️ No tables found to drop.');
            }

            this.writeln('');
            this.info(' 🚀 Running migrations...');
            const { Migrator } = await import('@arikajs/database');
            const migrationsPath = path.join(process.cwd(), 'database/migrations');
            const migrator = new Migrator(db, migrationsPath);
            await migrator.migrate();

            // Run seeders if requested
            if (this.option('seed')) {
                this.writeln('');
                this.info(' 📝 Seeding database...');
                const { SeedRunner } = await import('@arikajs/database');
                const seedersPath = path.join(process.cwd(), 'database/seeders');
                const runner = new SeedRunner(db, seedersPath);
                await runner.run();
                this.success('  ✅ Seeding completed.');
            }

            await db.closeAll();
            this.writeln('');
            this.success(' ✨ Database refreshed successfully!');

        } catch (error: any) {
            this.writeln('');
            this.error(` ❌ Fresh migration failed: ${error.message}`);
            process.exit(1);
        }
    }
}
