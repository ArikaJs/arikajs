/**
 * A single logged query entry
 */
export interface QueryLog {
    sql: string;
    bindings: any[];
    time: number;          // Execution time in ms
    connection: string;    // Connection name
    timestamp: Date;
}

/**
 * Query Logger — records all executed queries for debugging
 */
export class QueryLogger {
    private static logs: QueryLog[] = [];
    private static enabled: boolean = false;
    private static listeners: Array<(log: QueryLog) => void> = [];

    /**
     * Enable query logging
     */
    static enable(): void {
        this.enabled = true;
    }

    /**
     * Disable query logging
     */
    static disable(): void {
        this.enabled = false;
    }

    /**
     * Check if logging is active
     */
    static isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Log a query
     */
    static log(sql: string, bindings: any[], time: number, connection: string = 'default'): void {
        if (!this.enabled) return;

        const entry: QueryLog = {
            sql,
            bindings,
            time,
            connection,
            timestamp: new Date(),
        };

        this.logs.push(entry);

        // Notify live listeners (e.g. debug console output)
        for (const listener of this.listeners) {
            listener(entry);
        }
    }

    /**
     * Register a real-time listener on each query
     */
    static listen(callback: (log: QueryLog) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Get all logged queries
     */
    static getLog(): QueryLog[] {
        return [...this.logs];
    }

    /**
     * Get the last executed query
     */
    static getLastQuery(): QueryLog | undefined {
        return this.logs[this.logs.length - 1];
    }

    /**
     * Clear the query log
     */
    static flush(): void {
        this.logs = [];
    }

    /**
     * Print all queries to console for debugging
     */
    static dump(): void {
        for (const entry of this.logs) {
            console.log(
                `[${entry.connection}] ${entry.sql}`,
                entry.bindings.length ? `-- bindings: ${JSON.stringify(entry.bindings)}` : '',
                `(${entry.time.toFixed(2)}ms)`,
            );
        }
    }
}
