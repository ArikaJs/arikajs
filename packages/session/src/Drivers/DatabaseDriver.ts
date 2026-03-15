import { SessionDriver } from '../Contracts/SessionDriver';

/**
 * DatabaseDriver — stores sessions using a SQL database table.
 * Depends on the application's database instance implementing basic
 * table(), where(), update(), insert(), and delete() methods.
 */
export class DatabaseDriver implements SessionDriver {
    constructor(
        private readonly database: any,
        private readonly table: string = 'sessions',
        private readonly connection?: string
    ) { }

    public async load(sessionId: string): Promise<Record<string, any> | null> {
        const session = await this.database.table(this.table, this.connection)
            .where('id', sessionId)
            .first();

        if (!session) return null;

        if (session.expiration && session.expiration <= Math.floor(Date.now() / 1000)) {
            await this.destroy(sessionId);
            return null;
        }

        try {
            return JSON.parse(session.payload);
        } catch {
            return null;
        }
    }

    public async save(sessionId: string, data: Record<string, any>, ttlSeconds: number): Promise<void> {
        const payload = JSON.stringify(data);
        const expiration = Math.floor(Date.now() / 1000) + ttlSeconds;

        const exists = await this.database.table(this.table, this.connection)
            .where('id', sessionId)
            .exists();

        if (exists) {
            await this.database.table(this.table, this.connection)
                .where('id', sessionId)
                .update({ payload, expiration });
        } else {
            // Need to insert user_id into the table as well if this is a framework user
            let userId = null;
            if (data['auth_user_id']) {
                userId = data['auth_user_id'];
            }
            try {
                await this.database.table(this.table, this.connection).insert({
                    id: sessionId,
                    user_id: userId,
                    ip_address: null, // these could be populated via middleware later
                    user_agent: null,
                    payload,
                    expiration,
                });
            } catch {
                // Ignore duplicate key errors if two requests spawn here due to race
                await this.database.table(this.table, this.connection)
                    .where('id', sessionId)
                    .update({ payload, expiration });
            }
        }
    }

    public async destroy(sessionId: string): Promise<void> {
        await this.database.table(this.table, this.connection)
            .where('id', sessionId)
            .delete();
    }

    public async gc(maxLifetimeSeconds: number): Promise<void> {
        // Collect everything <= current time
        const now = Math.floor(Date.now() / 1000);
        await this.database.table(this.table, this.connection)
            .where('expiration', '<=', now)
            .delete();
    }

    public async acquireLock(sessionId: string, timeoutSeconds: number): Promise<boolean> {
        // Simple pessimistic locking in a separate locks table, or just use DB transactions.
        // For simplicity and to avoid creating a new table, we attempt to save a lock flag or rely on DB timeouts.
        // Returning true here as a simple mock; true database locking requires named locks or a dedicated lock column.
        return true;
    }

    public async releaseLock(sessionId: string): Promise<void> {
        // Release logic goes here.
    }
}
