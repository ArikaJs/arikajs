import { Request, Response } from 'arikajs';

interface ThrottleEntry {
    count: number;
    resetAt: number;
}

/**
 * Simple in-memory rate limiter middleware.
 * Usage: new ThrottleMiddleware(maxAttempts, windowSeconds)
 */
export class ThrottleMiddleware {
    private store: Map<string, ThrottleEntry> = new Map();

    constructor(
        private maxAttempts: number = 60,
        private windowSeconds: number = 60
    ) { }

    public async handle(req: Request, next: (req: Request) => Promise<Response>, res?: Response): Promise<Response> {
        const ip =
            (req as any).ip ||
            (req as any).headers?.['x-forwarded-for'] ||
            (req as any).raw?.socket?.remoteAddress ||
            'unknown';

        const key = `throttle:${ip}:${(req as any).path ?? ''}`;
        const now = Date.now();
        const windowMs = this.windowSeconds * 1000;

        const entry = this.store.get(key);

        // Helper to grab raw response (safely depending on when/where this runs)
        const raw = res?.raw ?? (req as any).res?.raw ?? (req as any).response?.raw ?? null;
        const setHeader = (k: string, v: string) => raw?.setHeader?.(k, v);

        if (entry && now < entry.resetAt) {
            if (entry.count >= this.maxAttempts) {
                const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
                setHeader('Retry-After', String(retryAfter));
                setHeader('X-RateLimit-Limit', String(this.maxAttempts));
                setHeader('X-RateLimit-Remaining', '0');

                // If response object exists (from dispatcher), use it, otherwise create one if possible
                // Note: The framework typically resolves this automatically in responses
                if (res && res.json) {
                    return res.json({ error: `Too many requests. Please try again in ${retryAfter} seconds.` }, 429);
                } else {
                    // Fallback returning a raw structure that the pipeline will eventually translate
                    return {
                        statusCode: 429,
                        body: { error: `Too many requests. Please try again in ${retryAfter} seconds.` }
                    } as any;
                }
            }
            entry.count++;
            setHeader('X-RateLimit-Limit', String(this.maxAttempts));
            setHeader('X-RateLimit-Remaining', String(this.maxAttempts - entry.count));
        } else {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
            setHeader('X-RateLimit-Limit', String(this.maxAttempts));
            setHeader('X-RateLimit-Remaining', String(this.maxAttempts - 1));
        }

        if (Math.random() < 0.01) {
            for (const [k, v] of this.store.entries()) {
                if (now >= v.resetAt) this.store.delete(k);
            }
        }

        return next(req);
    }
}
