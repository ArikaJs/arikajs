import { Connection } from '../Contracts/Database';

/**
 * Manages database transactions with automatic rollback on failure
 */
export class TransactionManager {
    private connection: Connection;
    private depth: number = 0;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Run a callback within a transaction.
     * Automatically commits on success and rolls back on failure.
     * Supports nested transactions via savepoints.
     */
    async transaction<T>(callback: (connection: Connection) => Promise<T>): Promise<T> {
        if (this.depth === 0) {
            await this.connection.beginTransaction();
        } else {
            // Nested transaction: use savepoints
            await this.connection.query(`SAVEPOINT sp_level${this.depth}`);
        }

        this.depth++;

        try {
            const result = await callback(this.connection);

            this.depth--;

            if (this.depth === 0) {
                await this.connection.commit();
            } else {
                await this.connection.query(`RELEASE SAVEPOINT sp_level${this.depth}`);
            }

            return result;
        } catch (error) {
            this.depth--;

            if (this.depth === 0) {
                await this.connection.rollback();
            } else {
                await this.connection.query(`ROLLBACK TO SAVEPOINT sp_level${this.depth}`);
            }

            throw error;
        }
    }

    /**
     * Begin a transaction manually
     */
    async begin(): Promise<void> {
        await this.connection.beginTransaction();
    }

    /**
     * Commit the current transaction
     */
    async commit(): Promise<void> {
        await this.connection.commit();
    }

    /**
     * Rollback the current transaction
     */
    async rollback(): Promise<void> {
        await this.connection.rollback();
    }
}
