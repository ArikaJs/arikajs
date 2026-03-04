import { DatabaseManager } from './DatabaseManager';
import { QueryBuilder } from './Query/QueryBuilder';
import { Expression } from './Query/Expression';
import { SchemaBuilder } from './Schema/SchemaBuilder';
import { QueryLogger } from './Query/QueryLogger';
import { Connection } from './Contracts/Database';
import { TransactionManager } from './Transactions/TransactionManager';

/**
 * Database facade - static interface to the database manager
 */
export class Database {
    private static manager: DatabaseManager;

    /**
     * Set the database manager instance
     */
    static setManager(manager: DatabaseManager): void {
        Database.manager = manager;
    }

    /**
     * Get the database manager instance
     */
    static getManager(): DatabaseManager {
        if (!Database.manager) {
            throw new Error('DatabaseManager not initialized. Call Database.setManager() first.');
        }
        return Database.manager;
    }

    /**
     * Create a new query builder for a table
     */
    static table(tableName: string, connectionName?: string): QueryBuilder {
        return Database.getManager().table(tableName, connectionName);
    }

    /**
     * Get a schema builder instance
     */
    static schema(connectionName?: string): SchemaBuilder {
        return Database.getManager().schema(connectionName);
    }

    /**
     * Execute a callback within a transaction (nested savepoints supported)
     */
    static async transaction<T>(
        callback: (trx: Connection) => Promise<T>,
        connectionName?: string
    ): Promise<T> {
        return await Database.getManager().transaction(callback, connectionName);
    }

    /**
     * Get a TransactionManager for manual begin/commit/rollback control
     */
    static async getTransactionManager(connectionName?: string): Promise<TransactionManager> {
        return Database.getManager().getTransactionManager(connectionName);
    }

    /**
     * Enable query logging
     */
    static enableQueryLog(): void {
        QueryLogger.enable();
    }

    /**
     * Disable query logging
     */
    static disableQueryLog(): void {
        QueryLogger.disable();
    }

    /**
     * Get all logged queries
     */
    static getQueryLog() {
        return QueryLogger.getLog();
    }

    /**
     * Flush (clear) the query log
     */
    static flushQueryLog(): void {
        QueryLogger.flush();
    }

    /**
     * Get a connection by name
     */
    static connection(name?: string) {
        return Database.getManager().connection(name);
    }

    /**
     * Create a raw SQL expression
     */
    static raw(value: string | number): Expression {
        return new Expression(value);
    }

    /**
     * Close all connections
     */
    static async closeAll(): Promise<void> {
        return Database.getManager().closeAll();
    }
}
