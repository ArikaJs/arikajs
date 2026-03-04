
import { CacheManager } from './CacheManager';
import { Store } from './Contracts/Store';

let cacheManager: CacheManager;

export class Cache {
    public static setManager(manager: CacheManager) {
        cacheManager = manager;
    }

    protected static getManager(): CacheManager {
        if (!cacheManager) {
            throw new Error('Cache system not configured. Please use Cache.setManager() to configure.');
        }
        return cacheManager;
    }

    public static store(name?: string) {
        return this.getManager().store(name);
    }

    public static async get(key: string, defaultValue: any = null) { return this.getManager().get(key, defaultValue); }
    public static async put(key: string, value: any, seconds: number) { return this.getManager().put(key, value, seconds); }
    public static async has(key: string) { return this.getManager().has(key); }
    public static async forever(key: string, value: any) { return this.getManager().forever(key, value); }
    public static async forget(key: string) { return this.getManager().forget(key); }
    public static async flush() { return this.getManager().flush(); }
    public static async increment(key: string, value: number = 1) { return this.getManager().increment(key, value); }
    public static async decrement(key: string, value: number = 1) { return this.getManager().decrement(key, value); }
    public static async add(key: string, value: any, seconds: number) { return this.getManager().add(key, value, seconds); }
    public static async pull(key: string, defaultValue: any = null) { return this.getManager().pull(key, defaultValue); }
    public static async remember(key: string, seconds: number, callback: () => Promise<any>) { return this.getManager().remember(key, seconds, callback); }
    public static async rememberForever(key: string, callback: () => Promise<any>) { return this.getManager().rememberForever(key, callback); }

    // Enterprise methods
    public static async getMultiple(keys: string[]) { return this.getManager().getMultiple(keys); }
    public static async putMultiple(values: Record<string, any>, seconds: number) { return this.getManager().putMultiple(values, seconds); }
    public static async forgetMultiple(keys: string[]) { return this.getManager().forgetMultiple(keys); }
    public static lock(name: string, seconds: number = 0, owner: string | null = null) { return this.getManager().lock(name, seconds, owner); }
    public static tags(names: string | string[]) { return this.getManager().tags(names); }
}

export { CacheManager, Store };
export { Repository } from './Repository';
export { MemoryDriver } from './Drivers/MemoryDriver';
export { DatabaseDriver } from './Drivers/DatabaseDriver';
