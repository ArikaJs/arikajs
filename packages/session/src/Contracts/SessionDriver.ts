
/**
 * Session driver contract.
 * All session storage backends must implement this interface.
 */
export interface SessionDriver {
    /**
     * Read session data by session ID. Returns null if not found or expired.
     */
    load(sessionId: string): Promise<Record<string, any> | null>;

    /**
     * Persist session data with a TTL in seconds.
     */
    save(sessionId: string, data: Record<string, any>, ttlSeconds: number): Promise<void>;

    /**
     * Delete a session by ID.
     */
    destroy(sessionId: string): Promise<void>;

    /**
     * Run garbage collection to delete expired sessions.
     * @param probability 0.0 – 1.0 likelihood of running GC on this call
     */
    gc(maxLifetimeSeconds: number): Promise<void>;

    /**
     * Optional: Acquire a lock for this session (for concurrency protection).
     * Should return true if lock was acquired, false otherwise.
     */
    acquireLock?(sessionId: string, timeoutSeconds: number): Promise<boolean>;

    /**
     * Optional: Release a previously acquired session lock.
     */
    releaseLock?(sessionId: string): Promise<void>;
}
