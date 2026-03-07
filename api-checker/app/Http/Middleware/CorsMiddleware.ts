import { Request, Response } from 'arikajs';

/**
 * Handles Cross-Origin Resource Sharing (CORS) headers.
 * Allows frontend apps on other origins to communicate with this API.
 */
export class CorsMiddleware {
    public async handle(req: Request, next: (req: Request) => Promise<Response>, res?: Response): Promise<Response> {
        const raw = (req as any).res?.raw ?? (req as any).response?.raw ?? null;

        const allowedOrigins: string[] = (process.env.CORS_ALLOWED_ORIGINS ?? '*').split(',').map((o: string) => o.trim());
        const requestOrigin: string = (req as any).headers?.['origin'] ?? '';

        let originHeader = '*';
        if (allowedOrigins[0] !== '*' && allowedOrigins.includes(requestOrigin)) {
            originHeader = requestOrigin;
        }

        const setHeader = (key: string, value: string) => {
            raw?.setHeader?.(key, value);
        };

        setHeader('Access-Control-Allow-Origin', originHeader);
        setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token');
        setHeader('Access-Control-Allow-Credentials', 'true');
        setHeader('Access-Control-Max-Age', '86400');
        setHeader('Vary', 'Origin');

        return next(req);
    }
}
