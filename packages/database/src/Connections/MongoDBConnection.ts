import { Connection, ConnectionConfig } from '../Contracts/Database';
import { MongoClient, Db, ReadPreference, ClientSession } from 'mongodb';

/**
 * MongoDB database connection
 *
 * Supports:
 *  - Single-host standalone
 *  - Replica sets with read/write splitting via ReadPreference
 *  - ACID transactions via Client Sessions (requires a replica set)
 *  - Connection pooling via the native MongoClient built-in pool
 */
export class MongoDBConnection implements Connection {
    private writeClient: MongoClient | null = null;
    private readClient: MongoClient | null = null;
    private writeDb: Db | null = null;
    private readDb: Db | null = null;
    private config: ConnectionConfig;
    private session: ClientSession | null = null;
    private inTransaction: boolean = false;

    constructor(config: ConnectionConfig) {
        this.config = config;
    }

    // ─── URI Helpers ───────────────────────────────────────────────────────────

    /**
     * Build a MongoDB connection URI from a config object
     */
    private buildUri(cfg: Partial<ConnectionConfig> & { database: string }): string {
        const host = cfg.host || '127.0.0.1';
        const port = cfg.port || 27017;
        const creds = (cfg.username && cfg.password)
            ? `${encodeURIComponent(cfg.username)}:${encodeURIComponent(cfg.password)}@`
            : '';
        return `mongodb://${creds}${host}:${port}/${cfg.database}`;
    }

    /**
     * Build a replica-set URI from an array of read-replica host configs
     */
    private buildReplicaSetUri(readHosts: Partial<ConnectionConfig>[]): string {
        const creds = (this.config.username && this.config.password)
            ? `${encodeURIComponent(this.config.username)}:${encodeURIComponent(this.config.password)}@`
            : '';
        const hostList = readHosts
            .map(h => `${h.host || '127.0.0.1'}:${h.port || 27017}`)
            .join(',');
        return `mongodb://${creds}${hostList}/${this.config.database}`;
    }

    // ─── Connection Management ─────────────────────────────────────────────────

    /**
     * Lazily establish both the write (primary) and read (secondary) connections
     */
    private async ensureConnected(): Promise<void> {
        // --- Write / Primary pool ---
        if (!this.writeClient) {
            const writeCfg = this.config.write
                ? { ...this.config, ...this.config.write }
                : this.config;

            this.writeClient = new MongoClient(this.buildUri(writeCfg as any), {
                maxPoolSize: writeCfg.pool?.max ?? 10,
                minPoolSize: writeCfg.pool?.min ?? 0,
                readPreference: ReadPreference.PRIMARY,
            });
            await this.writeClient.connect();
            this.writeDb = this.writeClient.db(this.config.database);
        }

        // --- Read / Secondary pool ---
        if (!this.readClient) {
            if (this.config.read) {
                // One or many read replicas → build a replica-set URI
                const readHosts = Array.isArray(this.config.read)
                    ? this.config.read
                    : [this.config.read];

                const uri = this.buildReplicaSetUri(readHosts);
                this.readClient = new MongoClient(uri, {
                    maxPoolSize: this.config.pool?.max ?? 10,
                    readPreference: ReadPreference.SECONDARY_PREFERRED,
                });
            } else {
                // No dedicated read host — reuse same server with secondaryPreferred preference
                this.readClient = new MongoClient(this.buildUri(this.config as any), {
                    maxPoolSize: this.config.pool?.max ?? 10,
                    readPreference: ReadPreference.SECONDARY_PREFERRED,
                });
            }
            await this.readClient.connect();
            this.readDb = this.readClient.db(this.config.database);
        }
    }

    // ─── Connection Interface ──────────────────────────────────────────────────

    /**
     * Raw SQL is not supported in MongoDB.
     * Use getDatabase() / getCollection() for native MongoDB operations.
     */
    async query(_sql: string, _bindings: any[] = []): Promise<any> {
        throw new Error(
            'Raw SQL queries are not supported in MongoDB. ' +
            'Use MongoDBConnection.getDatabase() or .getCollection() for native operations.'
        );
    }

    /**
     * Get the Db instance routed to the correct pool.
     *  - Read operations  → secondary preferred (read replica)
     *  - Write operations → primary
     *  - During a transaction → always primary
     */
    async getDatabase(forWrite: boolean = false): Promise<Db> {
        await this.ensureConnected();
        if (this.inTransaction) return this.writeDb!;
        return forWrite ? this.writeDb! : this.readDb!;
    }

    /**
     * Convenience: get a collection automatically routed to the right pool
     */
    async getCollection(name: string, forWrite: boolean = false) {
        const db = await this.getDatabase(forWrite);
        return db.collection(name);
    }

    /**
     * Get the underlying write MongoClient instance
     */
    async getClient(): Promise<MongoClient> {
        await this.ensureConnected();
        return this.writeClient!;
    }

    // ─── Transactions (replica set required) ──────────────────────────────────

    /**
     * Begin a MongoDB ACID transaction.
     * Requires a replica set — will throw on a standalone server.
     */
    async beginTransaction(): Promise<void> {
        await this.ensureConnected();
        if (this.inTransaction) {
            throw new Error('A MongoDB transaction is already in progress.');
        }
        this.session = this.writeClient!.startSession();
        this.session.startTransaction();
        this.inTransaction = true;
    }

    /**
     * Commit the active transaction
     */
    async commit(): Promise<void> {
        if (!this.session || !this.inTransaction) {
            throw new Error('No active MongoDB transaction to commit.');
        }
        await this.session.commitTransaction();
        this.session.endSession();
        this.session = null;
        this.inTransaction = false;
    }

    /**
     * Rollback (abort) the active transaction
     */
    async rollback(): Promise<void> {
        if (!this.session || !this.inTransaction) {
            throw new Error('No active MongoDB transaction to rollback.');
        }
        await this.session.abortTransaction();
        this.session.endSession();
        this.session = null;
        this.inTransaction = false;
    }

    /**
     * Get the active ClientSession — pass this to collection operations
     * when running queries inside a transaction.
     */
    getSession(): ClientSession | null {
        return this.session;
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Close both read and write connections
     */
    async close(): Promise<void> {
        if (this.session) {
            await this.session.endSession();
            this.session = null;
        }
        if (this.writeClient) {
            await this.writeClient.close();
            this.writeClient = null;
            this.writeDb = null;
        }
        // Only close readClient if it's a separate instance
        if (this.readClient) {
            await this.readClient.close();
            this.readClient = null;
            this.readDb = null;
        }
    }

    /**
     * Returns the write Db instance as the generic driver handle
     */
    getDriver(): any {
        return this.writeDb;
    }

    getSchemaGrammar(): any {
        throw new Error(
            'Schema builder is not supported for MongoDB. ' +
            'Use MongoDB Atlas schema validation or native Mongoose schemas instead.'
        );
    }
}
