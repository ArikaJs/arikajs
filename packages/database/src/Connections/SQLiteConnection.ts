import Database from 'better-sqlite3';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * SQLite database connection
 */
export class SQLiteConnection implements Connection {
    private db: Database.Database | null = null;
    private writeDb: Database.Database | null = null;
    private config: ConnectionConfig;

    constructor(config: ConnectionConfig) {
        this.config = config;
        this.connect();
    }

    /**
     * Connect to the database
     */
    async connect(): Promise<void> {
        let readConfig = this.config;

        if (this.config.read) {
            if (Array.isArray(this.config.read)) {
                const randomRead = this.config.read[Math.floor(Math.random() * this.config.read.length)];
                readConfig = { ...this.config, ...randomRead };
            } else {
                readConfig = { ...this.config, ...this.config.read };
            }
        }

        if (!this.db) {
            const dbPath = readConfig.database || ':memory:';
            // If config has explicit read/write split, open read DB read-only
            const isReadOnly = !!(this.config.read && this.config.write);
            this.db = new Database(dbPath, { readonly: isReadOnly });
        }

        if (this.config.write && !this.writeDb) {
            const writeConfig = { ...this.config, ...this.config.write };
            this.writeDb = new Database(writeConfig.database || ':memory:');
        }
    }

    /**
     * Disconnect from the database
     */
    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        if (this.writeDb) {
            this.writeDb.close();
            this.writeDb = null;
        }
    }

    /**
     * Execute a query
     */
    async query(sql: string, bindings: any[] = []): Promise<any[]> {
        if (!this.db) {
            await this.connect();
        }

        const preparedBindings = bindings.map(b => {
            if (b instanceof Date) return b.toISOString();
            if (typeof b === 'boolean') return b ? 1 : 0;
            return b;
        });

        const isWriteOperation = /^\s*(?:insert|update|delete|create|alter|drop|truncate|replace)/i.test(sql);
        const connection = (isWriteOperation && this.writeDb) ? this.writeDb : this.db!;

        try {
            const stmt = connection.prepare(sql);

            // Check if it's a SELECT query
            if (!isWriteOperation && sql.trim().toLowerCase().startsWith('select')) {
                return stmt.all(...preparedBindings);
            }

            // For INSERT, UPDATE, DELETE
            const info = stmt.run(...preparedBindings);
            return [{ affectedRows: info.changes, insertId: info.lastInsertRowid }];
        } catch (error: any) {
            throw new Error(`SQLite query failed: ${error.message}`);
        }
    }

    /**
     * Execute a raw query
     */
    async raw(sql: string): Promise<any> {
        if (!this.db) {
            await this.connect();
        }

        try {
            return this.db!.exec(sql);
        } catch (error: any) {
            throw new Error(`SQLite raw query failed: ${error.message}`);
        }
    }

    /**
     * Get the underlying database instance
     */
    getDriver(): Database.Database {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        await this.disconnect();
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        await this.query('BEGIN TRANSACTION');
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        await this.query('COMMIT');
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        await this.query('ROLLBACK');
    }

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar() {
        const { SQLiteGrammar } = require('../Schema/Grammars/SQLiteGrammar');
        return new SQLiteGrammar();
    }
}
