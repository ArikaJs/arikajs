import * as path from 'node:path';
import { SessionDriver } from './Contracts/SessionDriver';
import { MemoryDriver } from './Drivers/MemoryDriver';
import { FileDriver } from './Drivers/FileDriver';
import { RedisDriver } from './Drivers/RedisDriver';
import { DatabaseDriver } from './Drivers/DatabaseDriver';
import { Session } from './Session';
import { CookieSessionId } from './CookieSessionId';

export interface SessionConfig {
    driver: string;
    lifetime: number;        // minutes
    cookie: string;
    path: string;            // cookie path
    storagePath: string;     // filesystem path for file driver
    secure: boolean;
    httpOnly: boolean;
    sameSite: string;
    locking: boolean;
    lockTimeout: number;
    gcProbability: number;   // 0.0 – 1.0
    secret: string;          // used for signing session IDs
    connection?: any;        // Database or Redis connection instance
    table?: string;          // Database table name
    prefix?: string;         // Redis prefix
}

/**
 * SessionManager creates and manages session instances backed by configurable drivers.
 */
export class SessionManager {
    private customCreators: Map<string, (config: SessionConfig) => SessionDriver> = new Map();
    private driverInstances: Map<string, SessionDriver> = new Map();

    constructor(private readonly config: SessionConfig) { }

    /**
     * Resolve a driver instance (cached per driver name).
     */
    public driver(name?: string): SessionDriver {
        const driverName = name ?? this.config.driver;

        if (!this.driverInstances.has(driverName)) {
            this.driverInstances.set(driverName, this.createDriver(driverName));
        }

        return this.driverInstances.get(driverName)!;
    }

    /**
     * Create a new Session instance for the given raw session ID (from cookie).
     */
    public createSession(sessionId: string): Session {
        return new Session(
            this.driver(),
            sessionId,
            this.config.lifetime * 60, // convert minutes → seconds
        );
    }

    /**
     * The CookieSessionId helper for reading/writing session cookies.
     */
    public getCookieHelper(): CookieSessionId {
        return new CookieSessionId(this.config.cookie, this.config.secret);
    }

    /**
     * Register a custom driver factory.
     */
    public extend(driverName: string, factory: (config: SessionConfig) => SessionDriver): this {
        this.customCreators.set(driverName, factory);
        return this;
    }

    private createDriver(name: string): SessionDriver {
        if (this.customCreators.has(name)) {
            return this.customCreators.get(name)!(this.config);
        }

        switch (name) {
            case 'memory': return this.createMemoryDriver();
            case 'file': return this.createFileDriver();
            case 'redis': return this.createRedisDriver();
            case 'database': return this.createDatabaseDriver();
            default:
                throw new Error(`Session driver [${name}] is not supported.`);
        }
    }

    private createMemoryDriver(): SessionDriver {
        return new MemoryDriver();
    }

    private createFileDriver(): SessionDriver {
        const p = this.config.storagePath;
        const absPath = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
        return new FileDriver(absPath);
    }

    private createRedisDriver(): SessionDriver {
        if (!this.config.connection) {
            throw new Error('Redis connection is required for the [redis] session driver.');
        }
        return new RedisDriver(this.config.connection, this.config.prefix ?? 'arika_session:');
    }

    private createDatabaseDriver(): SessionDriver {
        if (!this.config.connection) {
            throw new Error('Database connection is required for the [database] session driver.');
        }
        return new DatabaseDriver(this.config.connection, this.config.table ?? 'sessions');
    }
}
