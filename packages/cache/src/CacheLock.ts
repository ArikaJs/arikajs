import { Store } from './Contracts/Store';

export class CacheLock {
    constructor(
        protected store: Store,
        protected name: string,
        protected seconds: number,
        protected ownerId: string | null = null
    ) {
        if (!this.ownerId) {
            this.ownerId = this.generateOwnerId();
        }
    }

    /**
     * Attempt to acquire the lock. If a callback is provided, it will be executed
     * and the lock will automatically be released afterward.
     */
    public async get(callback?: () => Promise<any>): Promise<any> {
        const acquired = await this.acquire();

        if (acquired && callback) {
            try {
                return await callback();
            } finally {
                await this.release();
            }
        }

        return acquired;
    }

    /**
     * Atomically attempt to acquire the lock.
     */
    public async acquire(): Promise<boolean> {
        if (!this.store.add) {
            // Fallback for custom drivers that don't implement atomic add.
            // THIS IS NOT COMPLETELY ATOMIC in distributed systems.
            if (await this.store.get(this.name) !== null) {
                return false;
            }
            await this.store.put(this.name, this.ownerId, this.seconds);
            return true;
        }
        return await this.store.add(this.name, this.ownerId, this.seconds);
    }

    /**
     * Release the lock, but only if we still own it.
     */
    public async release(): Promise<boolean> {
        const currentOwner = await this.store.get(this.name);

        if (currentOwner === this.ownerId) {
            await this.store.forget(this.name);
            return true;
        }

        return false;
    }

    /**
     * Force the lock to release, discarding ownership checks.
     */
    public async forceRelease(): Promise<void> {
        await this.store.forget(this.name);
    }

    /**
     * Attempt to acquire the lock, blocking for a given number of seconds.
     */
    public async block(seconds: number, callback?: () => Promise<any>): Promise<any> {
        const startingTime = Date.now();

        while (true) {
            if (await this.acquire()) {
                if (callback) {
                    try {
                        return await callback();
                    } finally {
                        await this.release();
                    }
                }
                return true;
            }

            if (Date.now() - startingTime >= seconds * 1000) {
                throw new Error(`Could not acquire cache lock [${this.name}] within ${seconds} seconds.`);
            }

            // Sleep for 250ms before trying again
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    /**
     * Get the current owner ID assigned to this lock.
     */
    public owner(): string {
        return this.ownerId!;
    }

    /**
     * Generate a unique identifier for the lock owner.
     */
    protected generateOwnerId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
