import { Store } from './Contracts/Store';

export class TagSet {
    constructor(protected store: Store, protected names: string[]) { }

    /**
     * Get a combined namespace prefix for all tags.
     */
    public async getNamespace(): Promise<string> {
        const ids = await Promise.all(this.names.map(name => this.tagId(name)));
        return ids.join('|') + ':';
    }

    /**
     * Get or create entirely a unique identifier for a tag.
     */
    public async tagId(name: string): Promise<string> {
        const key = `tag:${name}:key`;
        let id = await this.store.get(key);

        if (!id) {
            id = this.generateId();
            await this.store.forever(key, id);
        }

        return String(id);
    }

    /**
     * Reset all assigned tags by generating new IDs.
     * This effectively orphans all previous cache entries.
     */
    public async reset(): Promise<void> {
        await Promise.all(this.names.map(async name => {
            const key = `tag:${name}:key`;
            await this.store.forever(key, this.generateId());
        }));
    }

    /**
     * Generate a unique tag ID.
     */
    protected generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    }
}
