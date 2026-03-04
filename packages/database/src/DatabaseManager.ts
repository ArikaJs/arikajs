import { Connection, ConnectionConfig, DatabaseConfig, QueryCache } from './Contracts/Database';
import { QueryBuilder } from './Query/QueryBuilder';
import { SchemaBuilder } from './Schema/SchemaBuilder';
import { TransactionManager } from './Transactions/TransactionManager';

/**
 * Database manager - handles connections and query builders
 */
export class DatabaseManager {
    private connections: Map<string, Connection> = new Map();
    private config: DatabaseConfig;
    private cacheStore?: QueryCache;

    constructor(config: DatabaseConfig) {
        this.config = config;
    }

    /**
     * Get a connection by name
     */
    connection(name?: string): Connection | Promise<Connection> {
        const connectionName = name || this.config.default;

        if (this.connections.has(connectionName)) {
            return this.connections.get(connectionName)!;
        }

        const connectionConfig = this.config.connections[connectionName];
        if (!connectionConfig) {
            throw new Error(`Connection "${connectionName}" not configured`);
        }

        const connectionPromise = this.createConnection(connectionConfig).then(connection => {
            this.connections.set(connectionName, connection);
            return connection;
        });

        return connectionPromise;
    }

    /**
     * Create a new query builder
     */
    table(tableName: string, connectionName?: string): QueryBuilder {
        const connection = this.connection(connectionName);
        return new QueryBuilder(connection).table(tableName);
    }

    /**
     * Get a schema builder instance
     */
    schema(connectionName?: string): SchemaBuilder {
        const connection = this.connection(connectionName);
        return new SchemaBuilder(connection as any);
    }

    /**
     * Execute a callback within a transaction (nested savepoints supported)
     */
    async transaction<T>(
        callback: (trx: Connection) => Promise<T>,
        connectionName?: string
    ): Promise<T> {
        const connection = await this.connection(connectionName);
        const txManager = new TransactionManager(connection);
        return txManager.transaction(callback);
    }

    /**
     * Get a TransactionManager for manual begin/commit/rollback control
     */
    async getTransactionManager(connectionName?: string): Promise<TransactionManager> {
        const connection = await this.connection(connectionName);
        return new TransactionManager(connection);
    }

    /**
     * Set a query cache implementation
     */
    setCache(cache: QueryCache): void {
        this.cacheStore = cache;
    }

    /**
     * Get the configured query cache store
     */
    getCache(): QueryCache | undefined {
        return this.cacheStore;
    }

    /**
     * Close all connections
     */
    async closeAll(): Promise<void> {
        const promises = Array.from(this.connections.values()).map(conn => conn.close());
        await Promise.all(promises);
        this.connections.clear();
    }

    /**
     * Create a connection based on driver type
     */
    private async createConnection(config: ConnectionConfig): Promise<Connection> {
        switch (config.driver) {
            case 'mysql': {
                const { MySQLConnection } = await import('./Connections/MySQLConnection');
                return new MySQLConnection(config);
            }
            case 'pgsql': {
                const { PostgreSQLConnection } = await import('./Connections/PostgreSQLConnection');
                return new PostgreSQLConnection(config);
            }
            case 'sqlite': {
                const { SQLiteConnection } = await import('./Connections/SQLiteConnection');
                return new SQLiteConnection(config);
            }
            case 'mongodb': {
                const { MongoDBConnection } = await import('./Connections/MongoDBConnection');
                return new MongoDBConnection(config);
            }
            default:
                throw new Error(`Unsupported database driver: ${config.driver}`);
        }
    }
}
