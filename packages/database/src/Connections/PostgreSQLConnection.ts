import { Pool, PoolClient } from 'pg';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * PostgreSQL database connection
 */
export class PostgreSQLConnection implements Connection {
    private pool: Pool;
    private writePool?: Pool;
    private transactionClient?: PoolClient;

    constructor(config: ConnectionConfig) {
        // Build Read Pool
        let readConfig = config;

        // Pick one host randomly if read is an array pool
        if (config.read) {
            if (Array.isArray(config.read)) {
                const randomRead = config.read[Math.floor(Math.random() * config.read.length)];
                readConfig = { ...config, ...randomRead };
            } else {
                readConfig = { ...config, ...config.read };
            }
        }

        this.pool = new Pool({
            host: readConfig.host,
            port: readConfig.port,
            user: readConfig.username,
            password: readConfig.password,
            database: readConfig.database,
            min: readConfig.pool?.min || 0,
            max: readConfig.pool?.max || 10,
        });

        // Build Write Pool (if explicitly specified)
        if (config.write) {
            const writeConfig = { ...config, ...config.write };
            this.writePool = new Pool({
                host: writeConfig.host,
                port: writeConfig.port,
                user: writeConfig.username,
                password: writeConfig.password,
                database: writeConfig.database,
                min: writeConfig.pool?.min || 0,
                max: writeConfig.pool?.max || 10,
            });
        }
    }

    /**
     * Execute a raw SQL query
     */
    async query(sql: string, bindings: any[] = []): Promise<any> {
        let client: Pool | PoolClient | undefined = this.transactionClient;

        if (!client) {
            // Determine operation type (read vs write) to load balance pools
            const isWriteOperation = /^\s*(?:insert|update|delete|create|alter|drop|truncate|replace)/i.test(sql);
            client = (isWriteOperation && this.writePool) ? this.writePool : this.pool;
        }

        const result = await client.query(sql, bindings);
        return result.rows;
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        if (this.transactionClient) {
            throw new Error('Transaction already started');
        }
        const masterPool = this.writePool || this.pool;
        this.transactionClient = await masterPool.connect();
        await this.transactionClient.query('BEGIN');
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        if (!this.transactionClient) {
            throw new Error('No transaction to commit');
        }
        await this.transactionClient.query('COMMIT');
        this.transactionClient.release();
        this.transactionClient = undefined;
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        if (!this.transactionClient) {
            throw new Error('No transaction to rollback');
        }
        await this.transactionClient.query('ROLLBACK');
        this.transactionClient.release();
        this.transactionClient = undefined;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        if (this.transactionClient) {
            this.transactionClient.release();
            this.transactionClient = undefined;
        }
        if (this.writePool) {
            await this.writePool.end();
        }
        await this.pool.end();
    }

    /**
     * Get the underlying driver connection
     */
    getDriver(): Pool {
        return this.pool;
    }

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar() {
        const { PostgreSQLGrammar } = require('../Schema/Grammars/PostgreSQLGrammar');
        return new PostgreSQLGrammar();
    }
}
