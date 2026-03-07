import { Request, Response } from 'arikajs';

/**
 * Sets essential HTTP security headers to protect the application.
 */
export class SecurityHeadersMiddleware {
    public async handle(req: Request, next: (req: Request) => Promise<Response>, res?: Response): Promise<Response> {
        const raw = (req as any).res?.raw ?? (req as any).response?.raw ?? null;

        const setHeader = (key: string, value: string) => raw?.setHeader?.(key, value);

        setHeader('X-Content-Type-Options', 'nosniff');
        setHeader('X-Frame-Options', 'SAMEORIGIN');
        setHeader('X-XSS-Protection', '1; mode=block');
        setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if (process.env.NODE_ENV === 'production') {
            setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
        );

        return next(req);
    }
}
