
import { Store } from '../Contracts/Store';

export class DatabaseDriver implements Store {
    constructor(
        private database: any,
        private table: string,
        private prefix: string = ''
    ) { }

    public async get(key: string): Promise<any> {
        const cache = await this.database.table(this.table)
            .where('key', this.prefix + key)
            .first();

        if (!cache) {
            return null;
        }

        if (cache.expiration && cache.expiration <= Math.floor(Date.now() / 1000)) {
            await this.forget(key);
            return null;
        }

        return JSON.parse(cache.value);
    }

    public async put(key: string, value: any, seconds: number): Promise<void> {
        const expiration = Math.floor(Date.now() / 1000) + seconds;
        const jsonValue = JSON.stringify(value);
        const prefixedKey = this.prefix + key;

        const exists = await this.database.table(this.table).where('key', prefixedKey).exists();

        if (exists) {
            await this.database.table(this.table)
                .where('key', prefixedKey)
                .update({
                    value: jsonValue,
                    expiration: expiration
                });
        } else {
            await this.database.table(this.table).insert({
                key: prefixedKey,
                value: jsonValue,
                expiration: expiration
            });
        }
    }

    public async increment(key: string, value: number = 1): Promise<number> {
        const current = await this.get(key) || 0;
        const newValue = current + value;
        await this.forever(key, newValue);
        return newValue;
    }

    public async decrement(key: string, value: number = 1): Promise<number> {
        return this.increment(key, -value);
    }

    public async forever(key: string, value: any): Promise<void> {
        const jsonValue = JSON.stringify(value);
        const prefixedKey = this.prefix + key;

        const exists = await this.database.table(this.table).where('key', prefixedKey).exists();

        if (exists) {
            await this.database.table(this.table)
                .where('key', prefixedKey)
                .update({
                    value: jsonValue,
                    expiration: null
                });
        } else {
            await this.database.table(this.table).insert({
                key: prefixedKey,
                value: jsonValue,
                expiration: null
            });
        }
    }

    public async forget(key: string): Promise<void> {
        await this.database.table(this.table)
            .where('key', this.prefix + key)
            .delete();
    }

    public async flush(): Promise<void> {
        await this.database.table(this.table).delete();
    }

    public async add(key: string, value: any, seconds: number): Promise<boolean> {
        const prefixedKey = this.prefix + key;
        const jsonValue = JSON.stringify(value);
        const expiration = Math.floor(Date.now() / 1000) + seconds;

        // Try updating an already expired key first
        const updated = await this.database.table(this.table)
            .where('key', prefixedKey)
            .where('expiration', '<=', Math.floor(Date.now() / 1000))
            .update({
                value: jsonValue,
                expiration: expiration
            });

        if (updated > 0) return true;

        try {
            await this.database.table(this.table).insert({
                key: prefixedKey,
                value: jsonValue,
                expiration: expiration
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    public async getMultiple(keys: string[]): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        for (const k of keys) results[k] = null;
        if (keys.length === 0) return results;

        const prefixedKeys = keys.map(k => this.prefix + k);
        const rows = await this.database.table(this.table).whereIn('key', prefixedKeys);

        const now = Math.floor(Date.now() / 1000);
        const expiredKeys: string[] = [];

        for (const row of rows) {
            const originalKey = row.key.substring(this.prefix.length);
            if (row.expiration && row.expiration <= now) {
                expiredKeys.push(originalKey);
            } else {
                results[originalKey] = JSON.parse(row.value);
            }
        }

        if (expiredKeys.length > 0) {
            await this.forgetMultiple(expiredKeys);
        }

        return results;
    }

    public async putMultiple(values: Record<string, any>, seconds: number): Promise<void> {
        await Promise.all(
            Object.entries(values).map(([key, value]) => this.put(key, value, seconds))
        );
    }

    public async forgetMultiple(keys: string[]): Promise<void> {
        if (keys.length === 0) return;
        const prefixedKeys = keys.map(k => this.prefix + k);
        await this.database.table(this.table).whereIn('key', prefixedKeys).delete();
    }

    public getPrefix(): string {
        return this.prefix;
    }
}
