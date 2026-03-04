import { Repository } from './Repository';
import { MemoryDriver } from './Drivers/MemoryDriver';
import { DatabaseDriver } from './Drivers/DatabaseDriver';
import { RedisDriver } from './Drivers/RedisDriver';
import { Store } from './Contracts/Store';

export class CacheManager {
    protected stores: Map<string, Repository> = new Map();
    protected customCreators: Map<string, (config: any) => Store> = new Map();
    protected database: any;

    constructor(protected config: any, database?: any) {
        this.database = database;
    }

    public store(name?: string): Repository {
        const storeName = name || this.config.default;

        if (!this.stores.has(storeName)) {
            this.stores.set(storeName, this.resolve(storeName));
        }

        return this.stores.get(storeName)!;
    }

    protected resolve(name: string): Repository {
        const config = this.config.stores[name];

        if (!config) {
            throw new Error(`Cache store [${name}] is not defined.`);
        }

        if (this.customCreators.has(config.driver)) {
            return new Repository(this.customCreators.get(config.driver)!(config));
        }

        const driverMethod = `create${config.driver.charAt(0).toUpperCase() + config.driver.slice(1)}Driver`;

        if (typeof (this as any)[driverMethod] === 'function') {
            return new Repository((this as any)[driverMethod](config));
        }

        throw new Error(`Driver [${config.driver}] is not supported.`);
    }

    protected createMemoryDriver(): Store {
        return new MemoryDriver();
    }

    protected createDatabaseDriver(config: any): Store {
        return new DatabaseDriver(
            this.database.connection(config.connection),
            config.table,
            this.config.prefix || ''
        );
    }

    protected createRedisDriver(config: any): Store {
        return new RedisDriver(
            config,
            this.config.prefix || ''
        );
    }

    public extend(driver: string, callback: (config: any) => Store): this {
        this.customCreators.set(driver, callback);
        return this;
    }

    // Proxy common methods to default store
    public async get(key: string, defaultValue: any = null) { return this.store().get(key, defaultValue); }
    public async put(key: string, value: any, seconds: number) { return this.store().put(key, value, seconds); }
    public async has(key: string) { return this.store().has(key); }
    public async forever(key: string, value: any) { return this.store().forever(key, value); }
    public async forget(key: string) { return this.store().forget(key); }
    public async flush() { return this.store().flush(); }
    public async increment(key: string, value: number = 1) { return this.store().increment(key, value); }
    public async decrement(key: string, value: number = 1) { return this.store().decrement(key, value); }
    public async add(key: string, value: any, seconds: number) { return this.store().add(key, value, seconds); }
    public async pull(key: string, defaultValue: any = null) { return this.store().pull(key, defaultValue); }
    public async remember(key: string, seconds: number, callback: () => Promise<any>) { return this.store().remember(key, seconds, callback); }
    public async rememberForever(key: string, callback: () => Promise<any>) { return this.store().rememberForever(key, callback); }

    // Enterprise methods
    public async getMultiple(keys: string[]) { return this.store().getMultiple(keys); }
    public async putMultiple(values: Record<string, any>, seconds: number) { return this.store().putMultiple(values, seconds); }
    public async forgetMultiple(keys: string[]) { return this.store().forgetMultiple(keys); }
    public lock(name: string, seconds: number = 0, owner: string | null = null) { return this.store().lock(name, seconds, owner); }
    public tags(names: string | string[]) { return this.store().tags(names); }
}
