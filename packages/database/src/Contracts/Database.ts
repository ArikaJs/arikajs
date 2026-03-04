/**
 * Database connection configuration
 */
export interface ConnectionConfig {
    driver: 'mysql' | 'pgsql' | 'sqlite' | 'mongodb';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    charset?: string;
    timezone?: string;
    pool?: {
        min?: number;
        max?: number;
    };
    read?: Partial<ConnectionConfig> | Partial<ConnectionConfig>[];
    write?: Partial<ConnectionConfig>;
}

/**
 * Database configuration with multiple connections
 */
export interface DatabaseConfig {
    default: string;
    connections: Record<string, ConnectionConfig>;
}

/**
 * Database connection interface
 */
export interface Connection {
    /**
     * Execute a raw SQL query
     */
    query(sql: string, bindings?: any[]): Promise<any>;

    /**
     * Begin a transaction
     */
    beginTransaction(): Promise<void>;

    /**
     * Commit a transaction
     */
    commit(): Promise<void>;

    /**
     * Rollback a transaction
     */
    rollback(): Promise<void>;

    /**
     * Close the connection
     */
    close(): Promise<void>;

    /**
     * Get the underlying driver connection
     */
    getDriver(): any;

    /**
     * Get the schema grammar for this connection
     */
    getSchemaGrammar(): any;
}

/**
 * Query builder interface
 */
export interface QueryBuilder {
    /**
     * Set the table for the query
     */
    table(table: string): this;

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this;

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this;

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this;

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this;

    /**
     * Add a where null clause
     */
    whereNull(column: string): this;

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this;

    /**
     * Add a raw where clause
     */
    whereRaw(sql: string, bindings?: any[]): this;

    /**
     * Add a raw OR where clause
     */
    orWhereRaw(sql: string, bindings?: any[]): this;

    /**
     * Add an exists clause
     */
    whereExists(callback: (query: any) => void, boolean?: 'and' | 'or', not?: boolean): this;

    /**
     * Add a not exists clause
     */
    whereNotExists(callback: (query: any) => void, boolean?: 'and' | 'or'): this;

    /**
     * Add a select clause
     */
    select(...columns: (string | any)[]): this;

    /**
     * Add a raw select clause
     */
    selectRaw(sql: string): this;

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction?: 'asc' | 'desc'): this;

    /**
     * Add a limit clause
     */
    limit(limit: number): this;

    /**
     * Add an offset clause
     */
    offset(offset: number): this;

    /**
     * Execute the query and get all results
     */
    get(): Promise<any[]>;

    /**
     * Execute the query and get the first result
     */
    first(): Promise<any | null>;

    /**
     * Paginate the query results
     */
    paginate(page?: number, perPage?: number, path?: string): Promise<{ data: any[], meta: any, links: any }>;

    /**
     * Paginate without counting total pages
     */
    simplePaginate(page?: number, perPage?: number, path?: string): Promise<{ data: any[], meta: any, links: any }>;

    /**
     * Cursor paginate for high performance
     */
    cursorPaginate(cursor?: string | null, perPage?: number, cursorColumn?: string, path?: string): Promise<{ data: any[], meta: any, links: any }>;

    /**
     * Chunk the query results
     */
    chunk(count: number, callback: (results: any[], page: number) => Promise<boolean | void>): Promise<boolean>;

    /**
     * Insert a record or multiple records
     */
    insert(data: Record<string, any> | Record<string, any>[]): Promise<any>;

    /**
     * Update records
     */
    update(data: Record<string, any>): Promise<number>;

    /**
     * Delete records
     */
    delete(): Promise<number>;

    /**
     * Get the count of records
     */
    count(column?: string): Promise<number>;
    /**
     * Cache the query results
     */
    cache(ttl: number, key?: string): this;
}

/**
 * Cache store implementation used by the query builder
 */
export interface QueryCache {
    /**
     * Get an item from the cache, or execute the given closure and store the result
     */
    remember<T>(key: string, ttl: number, callback: () => Promise<T>): Promise<T>;

    /**
     * Remove an item from the cache
     */
    forget(key: string): Promise<boolean>;
}
