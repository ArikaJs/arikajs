
import { Request } from '../Request';
import { Response } from '../Response';
import { Middleware } from '../Middleware';

export class CorsMiddleware implements Middleware {
    /**
     * Handle the incoming request.
     */
    async handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> {
        // If it's an OPTIONS request (preflight), we can short-circuit
        if (request.method() === 'OPTIONS') {
            const res = response || new Response(request.getRaw() as any); // Fallback though Kernel always passes response
            this.setCorsHeaders(res);
            return res.status(204).send('');
        }

        const res = await next(request);
        this.setCorsHeaders(res);
        return res;
    }

    /**
     * Set the CORS headers on the response.
     */
    private setCorsHeaders(response: Response): void {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
}
