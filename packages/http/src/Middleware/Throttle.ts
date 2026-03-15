import { Request, Response } from '../index';
import { Middleware } from '../Middleware';

interface ThrottleEntry {
    count: number;
    resetAt: number;
}

/**
 * Simple in-memory rate limiter middleware.
 */
export class Throttle implements Middleware {
    private store: Map<string, ThrottleEntry> = new Map();

    constructor(
        private maxAttempts: number = 60,
        private windowSeconds: number = 60
    ) { }

    /**
     * Handle the incoming request.
     */
    public async handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> {
        const ip = request.ip() || '127.0.0.1';
        const key = `throttle:${ip}:${request.path()}`;
        const now = Date.now();
        const windowMs = this.windowSeconds * 1000;

        const entry = this.store.get(key);

        if (entry && now < entry.resetAt) {
            if (entry.count >= this.maxAttempts) {
                const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
                
                // If it's a 429, we should return early
                const errorRes = response || new Response(request.getRaw() as any);
                errorRes.header('Retry-After', String(retryAfter));
                errorRes.header('X-RateLimit-Limit', String(this.maxAttempts));
                errorRes.header('X-RateLimit-Remaining', '0');

                return errorRes.status(429).json({
                    message: `Too many requests. Please try again in ${retryAfter} seconds.`,
                    retry_after: retryAfter
                });
            }
            entry.count++;
        } else {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
        }

        const res = await next(request);
        const currentEntry = this.store.get(key)!;

        res.header('X-RateLimit-Limit', String(this.maxAttempts));
        res.header('X-RateLimit-Remaining', String(Math.max(0, this.maxAttempts - currentEntry.count)));

        // Cleanup expired entries probabilistically
        if (Math.random() < 0.01) {
            this.cleanup();
        }

        return res;
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.resetAt) {
                this.store.delete(key);
            }
        }
    }
}
