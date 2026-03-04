
import fs from 'fs';
import path from 'path';
import { DatabaseManager } from '../DatabaseManager';

/**
 * Migrator class for handling database migrations
 */
export class Migrator {
    private tableName = 'migrations';

    constructor(
        private db: DatabaseManager,
        private migrationsPath: string
    ) { }

    /**
     * Run all pending migrations
     */
    public async migrate(): Promise<void> {
        await this.ensureMigrationsTable();

        const ran = await this.getRan();
        const files = this.getMigrationFiles();

        const pending = files.filter(file => !ran.includes(file));

        if (pending.length === 0) {
            console.log('\x1b[32mNothing to migrate.\x1b[0m');
            return;
        }

        const batch = await this.getNextBatchNumber();

        for (const file of pending) {
            console.log(`\x1b[33mMigrating: ${file}\x1b[0m`);
            try {
                const migration = await this.resolve(file);
                await migration.up(this.db.schema());
                await this.logMigration(file, batch);
                console.log(`\x1b[32mMigrated:  ${file}\x1b[0m`);
            } catch (error: any) {
                console.error(`\x1b[31mMigration failed: ${file}\x1b[0m`);
                console.error(error.message);
                throw error;
            }
        }
    }

    /**
     * Rollback the last batch of migrations
     */
    public async rollback(): Promise<void> {
        await this.ensureMigrationsTable();
        const lastBatch = await this.getLastBatch();

        if (lastBatch.length === 0) {
            console.log('\x1b[32mNothing to rollback.\x1b[0m');
            return;
        }

        for (const migrationData of lastBatch) {
            console.log(`\x1b[33mRolling back: ${migrationData.migration}\x1b[0m`);
            try {
                const migration = await this.resolve(migrationData.migration);
                await migration.down(this.db.schema());
                await this.deleteMigration(migrationData.migration);
                console.log(`\x1b[32mRolled back:  ${migrationData.migration}\x1b[0m`);
            } catch (error: any) {
                console.error(`\x1b[31mRollback failed: ${migrationData.migration}\x1b[0m`);
                console.error(error.message);
                throw error;
            }
        }
    }

    /**
     * Ensure the migrations table exists
     */
    private async ensureMigrationsTable(): Promise<void> {
        const connection = await this.db.connection();
        const grammar = connection.getSchemaGrammar().constructor.name;
        let createSql = '';

        if (grammar === 'MySQLGrammar') {
            createSql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (id INT AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255), batch INT) ENGINE=InnoDB`;
        } else if (grammar === 'PostgreSQLGrammar') {
            createSql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (id SERIAL PRIMARY KEY, migration VARCHAR(255), batch INT)`;
        } else {
            createSql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, migration TEXT, batch INTEGER)`;
        }

        await connection.query(createSql);
    }

    /**
     * Get all ran migrations
     */
    private async getRan(): Promise<string[]> {
        const rows = await this.db.table(this.tableName).select('migration').get();
        return rows.map((row: any) => row.migration);
    }

    /**
     * Get all migration files in the directory
     */
    private getMigrationFiles(): string[] {
        if (!fs.existsSync(this.migrationsPath)) return [];
        return fs.readdirSync(this.migrationsPath)
            .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
            .sort();
    }

    /**
     * Resolve a migration file to a Migration instance
     */
    private async resolve(file: string): Promise<any> {
        const fullPath = path.resolve(this.migrationsPath, file);

        // Use dynamic import so tsx can handle .ts migration files
        const module = await import(fullPath);

        // Check for default export or named export
        let MigrationClass = module.default || module;

        // If it's still an object and has multiple exports, look for one that looks like a migration
        if (typeof MigrationClass !== 'function' && typeof MigrationClass === 'object') {
            MigrationClass = Object.values(MigrationClass).find(v => typeof v === 'function');
        }

        if (typeof MigrationClass !== 'function') {
            // Handle case where it's an exported function up/down (Knex style)
            if (module.up && module.down) {
                return {
                    up: () => module.up(this.db.schema()),
                    down: () => module.down(this.db.schema())
                };
            }
            throw new Error(`Migration ${file} does not export a valid Migration class or up/down functions.`);
        }

        return new MigrationClass();
    }

    /**
     * Log a migration as ran
     */
    private async logMigration(file: string, batch: number): Promise<void> {
        await this.db.table(this.tableName).insert({
            migration: file,
            batch
        });
    }

    /**
     * Delete a migration from the log
     */
    private async deleteMigration(file: string): Promise<void> {
        await this.db.table(this.tableName).where('migration', file).delete();
    }

    /**
     * Get the next batch number
     */
    private async getNextBatchNumber(): Promise<number> {
        const rows = await this.db.table(this.tableName).select('batch').orderBy('batch', 'desc').limit(1).get();
        return rows.length > 0 ? rows[0].batch + 1 : 1;
    }

    /**
     * Get all migrations from the last batch
     */
    private async getLastBatch(): Promise<any[]> {
        const rows = await this.db.table(this.tableName).select('batch').orderBy('batch', 'desc').limit(1).get();
        if (rows.length === 0) return [];
        const batch = rows[0].batch;
        return await this.db.table(this.tableName).where('batch', batch).orderBy('migration', 'desc').get();
    }
}
