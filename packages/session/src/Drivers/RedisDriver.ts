import { SessionDriver } from '../Contracts/SessionDriver';
import Redis, { Cluster } from 'ioredis';

/**
 * RedisDriver — stores sessions using Redis.
 * Supports native TTL (no GC needed) and excellent session locking.
 */
export class RedisDriver implements SessionDriver {
    constructor(
        private readonly redis: Redis | Cluster,
        private readonly prefix: string = 'arika_session:'
    ) { }

    private key(sessionId: string): string {
        return this.prefix + sessionId;
    }

    private lockKey(sessionId: string): string {
        return this.prefix + 'lock:' + sessionId;
    }

    public async load(sessionId: string): Promise<Record<string, any> | null> {
        const raw = await this.redis.get(this.key(sessionId));
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    public async save(sessionId: string, data: Record<string, any>, ttlSeconds: number): Promise<void> {
        const raw = JSON.stringify(data);
        if (ttlSeconds > 0) {
            await this.redis.set(this.key(sessionId), raw, 'EX', ttlSeconds);
        } else {
            await this.redis.set(this.key(sessionId), raw);
        }
    }

    public async destroy(sessionId: string): Promise<void> {
        await this.redis.del(this.key(sessionId));
    }

    public async gc(maxLifetimeSeconds: number): Promise<void> {
        // Redis handles TTL automatically — no-op.
    }

    public async acquireLock(sessionId: string, timeoutSeconds: number): Promise<boolean> {
        const result = await this.redis.set(this.lockKey(sessionId), '1', 'EX', timeoutSeconds, 'NX');
        return result === 'OK';
    }

    public async releaseLock(sessionId: string): Promise<void> {
        await this.redis.del(this.lockKey(sessionId));
    }
}
