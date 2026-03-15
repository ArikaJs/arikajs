import { SessionManager } from '../SessionManager';
import { Session } from '../Session';

/**
 * StartSession middleware.
 *
 * Lifecycle:
 *  1. Read session ID from the request cookie (or generate a new one)
 *  2. Create a Session instance (lazy — does NOT hit storage yet)
 *  3. Attach `request.session` so controllers can use it
 *  4. After response: save dirty session data back to the driver
 *  5. Write Set-Cookie header with (possibly new/rotated) session ID
 *  6. Probabilistically run GC
 */
export class StartSession {
    constructor(private readonly manager: SessionManager) { }

    public async handle(request: any, next: (req: any) => Promise<any>, response?: any): Promise<any> {
        const config = (this.manager as any).config;
        const cookieHelper = this.manager.getCookieHelper();

        // 1. Resolve session ID
        const cookieHeader: string =
            (typeof request.header === 'function' ? request.header('cookie') : null) ??
            request.req?.headers?.cookie ??
            '';

        let sessionId = cookieHelper.read(cookieHeader);
        let isNewSession = false;

        if (!sessionId) {
            sessionId = cookieHelper.generate();
            isNewSession = true;
        }

        // 2. Create a lazy Session instance
        const session: Session = this.manager.createSession(sessionId);

        // 3. Attach to request
        request.session = session;

        // Acquire lock if enabled
        const locking = config.locking ?? false;
        const lockTimeout = config.lockTimeout ?? 10; // seconds
        let locked = false;

        try {
            if (locking && typeof this.manager.driver().acquireLock === 'function') {
                const startTime = Date.now();
                while (!locked) {
                    locked = await this.manager.driver().acquireLock!(sessionId, lockTimeout);
                    if (locked) break;
                    if (Date.now() - startTime > lockTimeout * 1000) {
                        break; // Timeout reached, proceed anyway to prevent hanging forever
                    }
                    // Wait 50ms before retrying
                    await new Promise(r => setTimeout(r, 50));
                }
            }

            // 4. Run pipeline
            const res = await next(request);

            // 5. Persist session
            await session.save();

            // 6. Write cookie (always refresh TTL, or on new session)
            if (isNewSession || session.isDirty() || !session.isDestroyed()) {
                const cookieValue = session.isDestroyed()
                    ? cookieHelper.clear(config.path ?? '/')
                    : cookieHelper.write(session.getId(), {
                        lifetime: config.lifetime * 60,
                        path: config.path ?? '/',
                        secure: config.secure ?? false,
                        httpOnly: config.httpOnly ?? true,
                        sameSite: config.sameSite ?? 'Lax',
                    });
                this.writeSetCookie(res, response, cookieValue);
            }

            // 7. GC with configured probability
            const gcProbability = config.gcProbability ?? 0.01;
            if (Math.random() < gcProbability) {
                const maxLifetime = config.lifetime * 60;
                this.manager.driver().gc(maxLifetime).catch(() => { /* ignore gc errors */ });
            }

            return res;
        } finally {
            if (locked && typeof this.manager.driver().releaseLock === 'function') {
                await this.manager.driver().releaseLock!(sessionId).catch(() => { });
            }
        }
    }

    private writeSetCookie(res: any, fallbackResponse: any, cookieValue: string): void {
        const targetRes = res || fallbackResponse;

        // If it's an ArikaJS Response object, push to its internal cookies array
        if (targetRes && targetRes._cookies && Array.isArray(targetRes._cookies)) {
            targetRes._cookies.push(cookieValue);
            return;
        }

        // Try to write to the underlying Node.js ServerResponse before it is terminated
        const nodeRes: any = targetRes?.raw ?? null;

        if (nodeRes && typeof nodeRes.setHeader === 'function' && !nodeRes.headersSent) {
            const existing = nodeRes.getHeader('Set-Cookie');
            if (Array.isArray(existing)) {
                nodeRes.setHeader('Set-Cookie', [...existing, cookieValue]);
            } else if (typeof existing === 'string') {
                nodeRes.setHeader('Set-Cookie', [existing, cookieValue]);
            } else {
                nodeRes.setHeader('Set-Cookie', cookieValue);
            }
        }
    }
}
