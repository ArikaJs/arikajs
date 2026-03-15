
import { ServiceProvider } from '@arikajs/foundation';
import { SessionManager } from '@arikajs/session';
import { StartSession } from '@arikajs/session';
import * as path from 'path';

export class SessionServiceProvider extends ServiceProvider {
    /**
     * Register the session manager as a singleton.
     */
    public async register(): Promise<void> {
        this.app.singleton(SessionManager, () => {
            const config = this.app.config();
            const basePath = (this.app as any).getBasePath();

            const sessionConfig: any = {
                driver: config.get('session.driver', 'file'),
                lifetime: config.get('session.lifetime', 120),    // minutes
                cookie: config.get('session.cookie', 'arika_session'),
                path: config.get('session.path', '/'),
                storagePath: config.get('session.storagePath',
                    path.join(basePath, 'storage', 'sessions')),
                secure: config.get('session.secure', false),
                httpOnly: config.get('session.httpOnly', true),
                sameSite: config.get('session.sameSite', 'Lax'),
                locking: config.get('session.locking', false),
                lockTimeout: config.get('session.lockTimeout', 10),
                gcProbability: config.get('session.gcProbability', 0.01),
                secret: config.get('app.key', 'fallback-secret-change-me'),
            };

            if (sessionConfig.driver === 'database') {
                try {
                    // Try to resolve the database manager from the container
                    const dbManager = this.app.make('db');
                    sessionConfig.connection = dbManager; // passing manager or connection directly
                    sessionConfig.table = config.get('session.table', 'sessions');
                } catch {
                    // Framework fallback
                }
            }

            if (sessionConfig.driver === 'redis') {
                try {
                    // Try to resolve redis from container or cache store
                    const redis = this.app.make('redis') || (this.app.make('cache') as any).store('redis').getRedis();
                    sessionConfig.connection = redis;
                    sessionConfig.prefix = config.get('session.prefix', 'arika_session:');
                } catch {
                    // Framework fallback
                }
            }

            return new SessionManager(sessionConfig);
        });

        this.app.singleton('session', () => this.app.make(SessionManager));

        this.app.singleton(StartSession, () => {
            return new StartSession(this.app.make(SessionManager));
        });
    }

    /**
     * Boot — nothing required.
     */
    public async boot(): Promise<void> { }
}
