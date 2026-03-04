import { Store } from './Contracts/Store';
import { TagSet } from './TagSet';

export class TaggedStore implements Store {
    constructor(protected store: Store, protected tags: TagSet) { }

    protected async prefixKey(key: string): Promise<string> {
        return (await this.tags.getNamespace()) + key;
    }

    public async get(key: string): Promise<any> {
        return await this.store.get(await this.prefixKey(key));
    }

    public async put(key: string, value: any, seconds: number): Promise<void> {
        await this.store.put(await this.prefixKey(key), value, seconds);
    }

    public async add(key: string, value: any, seconds: number): Promise<boolean> {
        if (this.store.add) {
            return await this.store.add(await this.prefixKey(key), value, seconds);
        }
        if (await this.get(key) !== null) return false;
        await this.put(key, value, seconds);
        return true;
    }

    public async increment(key: string, value: number = 1): Promise<number> {
        return await this.store.increment(await this.prefixKey(key), value);
    }

    public async decrement(key: string, value: number = 1): Promise<number> {
        return await this.store.decrement(await this.prefixKey(key), value);
    }

    public async forever(key: string, value: any): Promise<void> {
        await this.store.forever(await this.prefixKey(key), value);
    }

    public async forget(key: string): Promise<void> {
        await this.store.forget(await this.prefixKey(key));
    }

    public async flush(): Promise<void> {
        await this.tags.reset();
    }

    public getPrefix(): string {
        return this.store.getPrefix();
    }

    public async getMultiple(keys: string[]): Promise<Record<string, any>> {
        const namespace = await this.tags.getNamespace();
        const prefixedKeys = keys.map(k => namespace + k);

        if (this.store.getMultiple) {
            const results = await this.store.getMultiple(prefixedKeys);
            const mapped: Record<string, any> = {};
            for (const [key, value] of Object.entries(results)) {
                // If the underlying store returns prefixed keys (e.g. database driver), it might not include namespace.
                // We just rely on mapping index-to-index since we pass exactly prefixedKeys.
            }
            // A safer approach: fetch everything and rebuild map
            const finalMap: Record<string, any> = {};
            for (let i = 0; i < keys.length; i++) {
                finalMap[keys[i]] = results[prefixedKeys[i]];
            }
            return finalMap;
        }

        // Fallback for custom drivers
        const fallback: Record<string, any> = {};
        for (const key of keys) {
            fallback[key] = await this.get(key);
        }
        return fallback;
    }

    public async putMultiple(values: Record<string, any>, seconds: number): Promise<void> {
        const namespace = await this.tags.getNamespace();
        const prefixedValues: Record<string, any> = {};

        for (const [key, value] of Object.entries(values)) {
            prefixedValues[namespace + key] = value;
        }

        if (this.store.putMultiple) {
            await this.store.putMultiple(prefixedValues, seconds);
        } else {
            // Fallback
            for (const [k, v] of Object.entries(prefixedValues)) {
                await this.store.put(k, v, seconds);
            }
        }
    }

    public async forgetMultiple(keys: string[]): Promise<void> {
        const namespace = await this.tags.getNamespace();
        const prefixedKeys = keys.map(k => namespace + k);

        if (this.store.forgetMultiple) {
            await this.store.forgetMultiple(prefixedKeys);
        } else {
            // Fallback
            for (const k of prefixedKeys) {
                await this.store.forget(k);
            }
        }
    }
}
