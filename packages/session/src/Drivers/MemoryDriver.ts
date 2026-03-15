import { SessionDriver } from '../Contracts/SessionDriver';

/**
 * MemoryDriver — stores sessions in a JavaScript Map.
 * ⚠️ Development only. Data is lost on server restart and not shared across processes.
 */
export class MemoryDriver implements SessionDriver {
    private store: Map<string, { data: Record<string, any>; expiresAt: number }> = new Map();

    public async load(sessionId: string): Promise<Record<string, any> | null> {
        const entry = this.store.get(sessionId);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(sessionId);
            return null;
        }
        return entry.data;
    }

    public async save(sessionId: string, data: Record<string, any>, ttlSeconds: number): Promise<void> {
        this.store.set(sessionId, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    public async destroy(sessionId: string): Promise<void> {
        this.store.delete(sessionId);
    }

    public async gc(maxLifetimeSeconds: number): Promise<void> {
        const now = Date.now();
        for (const [id, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(id);
            }
        }
    }

    private lockedSessions: Set<string> = new Set();

    public async acquireLock(sessionId: string, timeoutSeconds: number): Promise<boolean> {
        if (this.lockedSessions.has(sessionId)) return false;
        this.lockedSessions.add(sessionId);

        // Auto-release after timeout just in case it crashes
        setTimeout(() => this.lockedSessions.delete(sessionId), timeoutSeconds * 1000);
        return true;
    }

    public async releaseLock(sessionId: string): Promise<void> {
        this.lockedSessions.delete(sessionId);
    }
}
