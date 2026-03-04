
import { Store } from '../Contracts/Store';

interface CacheItem {
    value: any;
    expiresAt: number | null;
}

export class MemoryDriver implements Store {
    protected storage: Map<string, CacheItem> = new Map();

    async get(key: string): Promise<any> {
        const item = this.storage.get(key);

        if (!item) {
            return null;
        }

        if (item.expiresAt !== null && item.expiresAt < Date.now()) {
            this.forget(key);
            return null;
        }

        return item.value;
    }

    async put(key: string, value: any, seconds: number): Promise<void> {
        const expiresAt = Date.now() + (seconds * 1000);
        this.storage.set(key, { value, expiresAt });
    }

    async increment(key: string, value: number = 1): Promise<number> {
        const current = await this.get(key) || 0;
        const newValue = current + value;

        // We set it forever if it was already existing or start now.
        // Usually increment doesn't change TTL if exists, or sets a default.
        // For simplicity, we just update the value.
        const item = this.storage.get(key);
        this.storage.set(key, {
            value: newValue,
            expiresAt: item ? item.expiresAt : null
        });

        return newValue;
    }

    async decrement(key: string, value: number = 1): Promise<number> {
        return this.increment(key, -value);
    }

    async forever(key: string, value: any): Promise<void> {
        this.storage.set(key, { value, expiresAt: null });
    }

    async forget(key: string): Promise<void> {
        this.storage.delete(key);
    }

    async flush(): Promise<void> {
        this.storage.clear();
    }

    async add(key: string, value: any, seconds: number): Promise<boolean> {
        const item = this.storage.get(key);
        if (item && (item.expiresAt === null || item.expiresAt > Date.now())) {
            return false;
        }
        await this.put(key, value, seconds);
        return true;
    }

    async getMultiple(keys: string[]): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        for (const key of keys) {
            results[key] = await this.get(key);
        }
        return results;
    }

    async putMultiple(values: Record<string, any>, seconds: number): Promise<void> {
        for (const [key, value] of Object.entries(values)) {
            await this.put(key, value, seconds);
        }
    }

    async forgetMultiple(keys: string[]): Promise<void> {
        for (const key of keys) {
            this.storage.delete(key);
        }
    }

    getPrefix(): string {
        return '';
    }
}
