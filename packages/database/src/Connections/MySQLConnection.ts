import mysql from 'mysql2/promise';
import { Connection, ConnectionConfig } from '../Contracts/Database';

/**
 * MySQL database connection
 */
export class MySQLConnection implements Connection {
    private pool: mysql.Pool;
    private writePool?: mysql.Pool;
    private transactionConnection?: mysql.PoolConnection;

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

        this.pool = mysql.createPool({
            host: readConfig.host,
            port: readConfig.port,
            user: readConfig.username,
            password: readConfig.password,
            database: readConfig.database,
            charset: readConfig.charset || 'utf8mb4',
            timezone: readConfig.timezone || '+00:00',
            waitForConnections: true,
            connectionLimit: readConfig.pool?.max || 10,
            queueLimit: 0,
        });

        // Build Write Pool (if explicitly specified)
        if (config.write) {
            const writeConfig = { ...config, ...config.write };
            this.writePool = mysql.createPool({
                host: writeConfig.host,
                port: writeConfig.port,
                user: writeConfig.username,
                password: writeConfig.password,
                database: writeConfig.database,
                charset: writeConfig.charset || 'utf8mb4',
                timezone: writeConfig.timezone || '+00:00',
                waitForConnections: true,
                connectionLimit: writeConfig.pool?.max || 10,
                queueLimit: 0,
            });
        }
    }

    /**
     * Execute a raw SQL query
     */
    async query(sql: string, bindings: any[] = []): Promise<any> {
        let connection: mysql.Pool | mysql.PoolConnection | undefined = this.transactionConnection;

        if (!connection) {
            // Determine operation type (read vs write) to load balance pools
            const isWriteOperation = /^\s*(?:insert|update|delete|create|alter|drop|truncate|replace)/i.test(sql);
            connection = (isWriteOperation && this.writePool) ? this.writePool : this.pool;
        }

        const [rows] = await connection.execute(sql, bindings);
        return rows;
    }

    /**
     * Begin a transaction
     */
    async beginTransaction(): Promise<void> {
        if (this.transactionConnection) {
            throw new Error('Transaction already started');
        }
        const masterPool = this.writePool || this.pool;
        this.transactionConnection = await masterPool.getConnection();
        await this.transactionConnection.beginTransaction();
    }

    /**
     * Commit a transaction
     */
    async commit(): Promise<void> {
        if (!this.transactionConnection) {
            throw new Error('No transaction to commit');
        }
        await this.transactionConnection.commit();
        this.transactionConnection.release();
        this.transactionConnection = undefined;
    }

    /**
     * Rollback a transaction
     */
    async rollback(): Promise<void> {
        if (!this.transactionConnection) {
            throw new Error('No transaction to rollback');
        }
        await this.transactionConnection.rollback();
        this.transactionConnection.release();
        this.transactionConnection = undefined;
    }

    /**
     * Close the connection
     */
    async close(): Promise<void> {
        if (this.transactionConnection) {
            this.transactionConnection.release();
            this.transactionConnection = undefined;
        }
        if (this.writePool) {
            await this.writePool.end();
        }
        await this.pool.end();
    }

    /**
     * Get the underlying driver connection
     */
    getDriver(): mysql.Pool {
        return this.pool;
    }

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar() {
        const { MySQLGrammar } = require('../Schema/Grammars/MySQLGrammar');
        return new MySQLGrammar();
    }
}
