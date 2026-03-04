import { Connection, QueryBuilder as QueryBuilderInterface } from '../Contracts/Database';
import { Database } from '../Database';
import { Expression } from './Expression';
import { QueryLogger } from './QueryLogger';

/**
 * Where clause structure
 */
interface WhereClause {
    type: 'basic' | 'in' | 'notIn' | 'null' | 'notNull' | 'raw' | 'exists' | 'notExists';
    column: string;
    operator?: string;
    value?: any;
    query?: QueryBuilder;
    boolean: 'and' | 'or';
}

export class QueryBuilder implements QueryBuilderInterface {
    private tableName?: string;
    private selectColumns: string[] = ['*'];
    private selectRawExpressions: Array<{ sql: string; bindings: any[] }> = [];
    private whereClauses: WhereClause[] = [];
    private orderByColumns: Array<{ column: string; direction: 'asc' | 'desc' }> = [];
    private limitValue?: number;
    private offsetValue?: number;
    private cacheTtl?: number;
    private cacheKey?: string;
    private resolvedConnection: Connection | null = null;

    constructor(private connection: Connection | Promise<Connection>) { }

    /**
     * Get the resolved connection
     */
    private async getResolvedConnection(): Promise<Connection> {
        if (!this.resolvedConnection) {
            this.resolvedConnection = await this.connection;
        }
        return this.resolvedConnection;
    }

    /**
     * Set the table for the query
     */
    table(table: string): this {
        this.tableName = table;
        return this;
    }

    /**
     * Add a select clause
     */
    select(...columns: (string | Expression)[]): this {
        this.selectColumns = columns.map(c => c instanceof Expression ? String(c.getValue()) : c);
        return this;
    }

    /**
     * Add a raw select clause with optional bindings
     */
    selectRaw(sql: string, bindings: any[] = []): this {
        this.selectRawExpressions.push({ sql, bindings });
        return this;
    }

    /**
     * Add a where clause
     */
    where(column: string, operator: any, value?: any): this {
        // Handle where(column, value) syntax
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        this.whereClauses.push({
            type: 'basic',
            column,
            operator,
            value,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add an OR where clause
     */
    orWhere(column: string, operator: any, value?: any): this {
        // Handle orWhere(column, value) syntax
        if (value === undefined) {
            value = operator;
            operator = '=';
        }

        this.whereClauses.push({
            type: 'basic',
            column,
            operator,
            value,
            boolean: 'or',
        });

        return this;
    }

    /**
     * Add a where in clause
     */
    whereIn(column: string, values: any[]): this {
        this.whereClauses.push({
            type: 'in',
            column,
            value: values,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where not in clause
     */
    whereNotIn(column: string, values: any[]): this {
        this.whereClauses.push({
            type: 'notIn',
            column,
            value: values,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where null clause
     */
    whereNull(column: string): this {
        this.whereClauses.push({
            type: 'null',
            column,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a where not null clause
     */
    whereNotNull(column: string): this {
        this.whereClauses.push({
            type: 'notNull',
            column,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a raw where clause
     */
    whereRaw(sql: string, bindings: any[] = []): this {
        this.whereClauses.push({
            type: 'raw',
            column: sql,
            value: bindings,
            boolean: 'and',
        });

        return this;
    }

    /**
     * Add a raw OR where clause
     */
    orWhereRaw(sql: string, bindings: any[] = []): this {
        this.whereClauses.push({
            type: 'raw',
            column: sql,
            value: bindings,
            boolean: 'or',
        });

        return this;
    }

    /**
     * Add an exists clause
     */
    whereExists(callback: (query: QueryBuilder) => void, boolean: 'and' | 'or' = 'and', not: boolean = false): this {
        const query = new QueryBuilder(this.connection);
        callback(query);

        this.whereClauses.push({
            type: not ? 'notExists' : 'exists',
            column: '',
            query,
            boolean,
        });

        return this;
    }

    /**
     * Add a not exists clause
     */
    whereNotExists(callback: (query: QueryBuilder) => void, boolean: 'and' | 'or' = 'and'): this {
        return this.whereExists(callback, boolean, true);
    }

    /**
     * Add an order by clause
     */
    orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
        this.orderByColumns.push({ column, direction });
        return this;
    }

    /**
     * Add a limit clause
     */
    limit(limit: number): this {
        this.limitValue = limit;
        return this;
    }

    /**
     * Add an offset clause
     */
    offset(offset: number): this {
        this.offsetValue = offset;
        return this;
    }

    /**
     * Cache the query results
     */
    cache(ttl: number, key?: string): this {
        this.cacheTtl = ttl;
        this.cacheKey = key;
        return this;
    }

    /**
     * Execute the query and get all results
     */
    async get(): Promise<any[]> {
        const { sql, bindings } = this.buildSelectQuery();

        if (this.cacheTtl !== undefined) {
            const cacheStore = Database.getManager().getCache();
            if (cacheStore) {
                // Generate a key based on SQL and bindings if not provided
                const key = this.cacheKey || `db:${Buffer.from(sql + JSON.stringify(bindings)).toString('base64')}`;
                return cacheStore.remember(key, this.cacheTtl, async () => {
                    const connection = await this.getResolvedConnection();
                    return await connection.query(sql, bindings);
                });
            }
        }

        const connection = await this.getResolvedConnection();
        const start = Date.now();
        const rows = await connection.query(sql, bindings);
        QueryLogger.log(sql, bindings, Date.now() - start);
        return rows;
    }

    /**
     * Execute the query and get the first result
     */
    async first(): Promise<any | null> {
        this.limit(1);
        const results = await this.get();
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Paginate the query results
     */
    async paginate(page: number = 1, perPage: number = 15, path: string = '/'): Promise<{ data: any[], meta: any, links: any }> {
        const total = await this.count();
        const offset = (page - 1) * perPage;

        this.limit(perPage).offset(offset);
        const data = await this.get();
        const lastPage = Math.ceil(total / perPage);

        return {
            data,
            meta: {
                total,
                per_page: perPage,
                current_page: page,
                last_page: lastPage,
                first_page: 1,
                from: total > 0 ? offset + 1 : null,
                to: total > 0 ? Math.min(offset + perPage, total) : null,
            },
            links: {
                prev_page_url: page > 1 ? `${path}?page=${page - 1}` : null,
                next_page_url: page < lastPage ? `${path}?page=${page + 1}` : null,
            }
        };
    }

    /**
     * Paginate without counting total pages
     */
    async simplePaginate(page: number = 1, perPage: number = 15, path: string = '/'): Promise<{ data: any[], meta: any, links: any }> {
        const offset = (page - 1) * perPage;

        // Fetch perPage + 1 records to check if there are more records
        this.limit(perPage + 1).offset(offset);
        let data = await this.get();

        const hasMore = data.length > perPage;
        if (hasMore) {
            data.pop(); // Remove the extra record
        }

        return {
            data,
            meta: {
                per_page: perPage,
                current_page: page,
                first_page: 1,
                from: data.length > 0 ? offset + 1 : null,
                to: data.length > 0 ? offset + data.length : null,
            },
            links: {
                prev_page_url: page > 1 ? `${path}?page=${page - 1}` : null,
                next_page_url: hasMore ? `${path}?page=${page + 1}` : null,
            }
        };
    }

    /**
     * Cursor paginate for high performance
     */
    async cursorPaginate(cursor: string | null = null, perPage: number = 15, cursorColumn: string = 'id', path: string = '/'): Promise<{ data: any[], meta: any, links: any }> {
        if (cursor) {
            this.where(cursorColumn, '>', cursor);
        }

        this.orderBy(cursorColumn, 'asc').limit(perPage + 1);
        let data = await this.get();

        const hasMore = data.length > perPage;
        if (hasMore) {
            data.pop();
        }

        const nextCursor = hasMore && data.length > 0 ? data[data.length - 1][cursorColumn] : null;

        return {
            data,
            meta: {
                per_page: perPage,
                has_more: hasMore,
            },
            links: {
                next_page_url: nextCursor ? `${path}?cursor=${nextCursor}` : null,
            }
        };
    }

    /**
     * Chunk the query results
     */
    async chunk(count: number, callback: (results: any[], page: number) => Promise<boolean | void>): Promise<boolean> {
        let page = 1;

        while (true) {
            // Clone the query builder without offset/limit so we can set them clean
            const chunkQuery = new QueryBuilder(this.connection);
            Object.assign(chunkQuery, this);
            chunkQuery.limit(count).offset((page - 1) * count);

            const results = await chunkQuery.get();

            if (results.length === 0) {
                break;
            }

            const result = await callback(results, page);

            if (result === false) {
                return false;
            }

            if (results.length < count) {
                break;
            }

            page++;
        }

        return true;
    }

    /**
     * Insert a record or multiple records
     */
    async insert(data: Record<string, any> | Record<string, any>[]): Promise<any> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) {
            return null;
        }

        const columns = Object.keys(dataArray[0]);

        // Build placeholders for all rows
        const placeholders = dataArray.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');

        // Extract plain values for all rows
        const values: any[] = [];
        for (const row of dataArray) {
            for (const col of columns) {
                values.push(row[col] !== undefined ? row[col] : null);
            }
        }

        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
        const connection = await this.getResolvedConnection();
        const startI = Date.now();
        const resultI = await connection.query(sql, values);
        QueryLogger.log(sql, values, Date.now() - startI);
        return resultI;
    }

    /**
     * Update records
     */
    async update(data: Record<string, any>): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');

        const { whereClause, bindings: whereBindings } = this.buildWhereClause();
        const sql = `UPDATE ${this.tableName} SET ${setClause}${whereClause}`;

        const connection = await this.getResolvedConnection();
        const startU = Date.now();
        const resultU = await connection.query(sql, [...values, ...whereBindings]);
        QueryLogger.log(sql, [...values, ...whereBindings], Date.now() - startU);
        return resultU.affectedRows || resultU.rowCount || 0;
    }

    /**
     * Delete records
     */
    async delete(): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const { whereClause, bindings } = this.buildWhereClause();
        const sql = `DELETE FROM ${this.tableName}${whereClause}`;

        const connection = await this.getResolvedConnection();
        const startD = Date.now();
        const resultD = await connection.query(sql, bindings);
        QueryLogger.log(sql, bindings, Date.now() - startD);
        return resultD.affectedRows || resultD.rowCount || 0;
    }

    /**
     * Get the count of records
     */
    async count(column: string = '*'): Promise<number> {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const { whereClause, bindings } = this.buildWhereClause();
        const sql = `SELECT COUNT(${column}) as count FROM ${this.tableName}${whereClause}`;

        const connection = await this.getResolvedConnection();
        const result = await connection.query(sql, bindings);
        return parseInt(result[0].count);
    }

    /**
     * Build the SELECT query
     */
    buildSelectQuery(): { sql: string; bindings: any[] } {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const rawSelectSql = this.selectRawExpressions.map(r => r.sql);
        const selectBindings = this.selectRawExpressions.flatMap(r => r.bindings);

        let columnsList = [...this.selectColumns, ...rawSelectSql].join(', ');
        if (!columnsList) columnsList = '*';

        let sql = `SELECT ${columnsList} FROM ${this.tableName}`;

        const { whereClause, bindings: whereBindings } = this.buildWhereClause();
        sql += whereClause;

        // Select bindings must come BEFORE where bindings
        const bindings = [...selectBindings, ...whereBindings];

        if (this.orderByColumns.length > 0) {
            const orderBy = this.orderByColumns
                .map(({ column, direction }) => `${column} ${direction.toUpperCase()}`)
                .join(', ');
            sql += ` ORDER BY ${orderBy}`;
        }

        if (this.limitValue !== undefined) {
            sql += ` LIMIT ${this.limitValue}`;
        }

        if (this.offsetValue !== undefined) {
            sql += ` OFFSET ${this.offsetValue}`;
        }

        return { sql, bindings };
    }

    /**
     * Build the WHERE clause
     */
    private buildWhereClause(): { whereClause: string; bindings: any[] } {
        if (this.whereClauses.length === 0) {
            return { whereClause: '', bindings: [] };
        }

        const bindings: any[] = [];
        const clauses: string[] = [];

        this.whereClauses.forEach((where, index) => {
            const boolean = index === 0 ? '' : ` ${where.boolean.toUpperCase()} `;

            switch (where.type) {
                case 'basic':
                    clauses.push(`${boolean}${where.column} ${where.operator} ?`);
                    bindings.push(where.value);
                    break;

                case 'in':
                    const inPlaceholders = where.value.map(() => '?').join(', ');
                    clauses.push(`${boolean}${where.column} IN (${inPlaceholders})`);
                    bindings.push(...where.value);
                    break;

                case 'notIn':
                    const notInPlaceholders = where.value.map(() => '?').join(', ');
                    clauses.push(`${boolean}${where.column} NOT IN (${notInPlaceholders})`);
                    bindings.push(...where.value);
                    break;

                case 'null':
                    clauses.push(`${boolean}${where.column} IS NULL`);
                    break;

                case 'notNull':
                    clauses.push(`${boolean}${where.column} IS NOT NULL`);
                    break;

                case 'raw':
                    clauses.push(`${boolean}${where.column}`);
                    if (where.value && Array.isArray(where.value)) {
                        bindings.push(...where.value);
                    }
                    break;

                case 'exists':
                case 'notExists':
                    if (where.query) {
                        const { sql: subSql, bindings: subBindings } = where.query.buildSelectQuery();
                        const existsOperator = where.type === 'notExists' ? 'NOT EXISTS' : 'EXISTS';
                        clauses.push(`${boolean}${existsOperator} (${subSql})`);
                        bindings.push(...subBindings);
                    }
                    break;
            }
        });

        return {
            whereClause: ' WHERE ' + clauses.join(''),
            bindings,
        };
    }
}
