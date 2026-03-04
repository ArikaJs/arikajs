import { Store } from './Contracts/Store';
import { CacheLock } from './CacheLock';
import { TagSet } from './TagSet';
import { TaggedStore } from './TaggedStore';

export class Repository {
    constructor(protected store: Store) { }

    async get(key: string, defaultValue: any = null): Promise<any> {
        const value = await this.store.get(key);
        return value !== null ? value : defaultValue;
    }

    async has(key: string): Promise<boolean> {
        return (await this.get(key)) !== null;
    }

    async put(key: string, value: any, seconds: number): Promise<void> {
        await this.store.put(key, value, seconds);
    }

    async add(key: string, value: any, seconds: number): Promise<boolean> {
        if (await this.has(key)) {
            return false;
        }

        await this.put(key, value, seconds);
        return true;
    }

    async increment(key: string, value: number = 1): Promise<number> {
        return this.store.increment(key, value);
    }

    async decrement(key: string, value: number = 1): Promise<number> {
        return this.store.decrement(key, value);
    }

    async forever(key: string, value: any): Promise<void> {
        await this.store.forever(key, value);
    }

    async remember(key: string, seconds: number, callback: () => Promise<any>): Promise<any> {
        let value = await this.get(key);

        if (value !== null) {
            return value;
        }

        value = await callback();
        await this.put(key, value, seconds);

        return value;
    }

    async rememberForever(key: string, callback: () => Promise<any>): Promise<any> {
        let value = await this.get(key);

        if (value !== null) {
            return value;
        }

        value = await callback();
        await this.forever(key, value);

        return value;
    }

    async pull(key: string, defaultValue: any = null): Promise<any> {
        const value = await this.get(key, defaultValue);
        await this.forget(key);
        return value;
    }

    async forget(key: string): Promise<void> {
        await this.store.forget(key);
    }

    async flush(): Promise<void> {
        await this.store.flush();
    }

    async getMultiple(keys: string[]): Promise<Record<string, any>> {
        if (keys.length === 0) return {};
        if (this.store.getMultiple) {
            return await this.store.getMultiple(keys);
        }

        const results: Record<string, any> = {};
        for (const key of keys) {
            results[key] = await this.get(key);
        }
        return results;
    }

    async putMultiple(values: Record<string, any>, seconds: number): Promise<void> {
        if (Object.keys(values).length === 0) return;
        if (this.store.putMultiple) {
            return await this.store.putMultiple(values, seconds);
        }

        for (const [key, value] of Object.entries(values)) {
            await this.put(key, value, seconds);
        }
    }

    async forgetMultiple(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        if (this.store.forgetMultiple) {
            return await this.store.forgetMultiple(keys);
        }

        for (const key of keys) {
            await this.forget(key);
        }
    }

    lock(name: string, seconds: number = 0, owner: string | null = null): CacheLock {
        return new CacheLock(this.store, name, seconds, owner);
    }

    tags(names: string | string[]): Repository {
        const tagNames = Array.isArray(names) ? names : [names];
        return new Repository(new TaggedStore(this.store, new TagSet(this.store, tagNames)));
    }

    getStore(): Store {
        return this.store;
    }
}
