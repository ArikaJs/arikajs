
import { Request, Response, Middleware } from '@arikajs/http';
import { HttpException } from '@arikajs/http';
import crypto from 'node:crypto';

export class VerifyCsrfToken implements Middleware {
    /**
     * The URIs that should be excluded from CSRF verification.
     */
    protected except: string[] = [];

    /**
     * Handle the incoming request.
     */
    public async handle(request: Request, next: (request: Request) => Promise<Response>): Promise<Response> {
        if (this.isReading(request) || this.runningUnitTests() || await this.inExceptArray(request)) {
            return await this.addCookieToResponse(request, await next(request));
        }

        if (await this.tokensMatch(request)) {
            return await this.addCookieToResponse(request, await next(request));
        }

        throw new HttpException(419, 'CSRF token mismatch.');
    }

    /**
     * Determine if the request has a URI that should pass through CSRF verification.
     */
    protected async inExceptArray(request: Request): Promise<boolean> {
        const path = request.path();
        for (const except of this.except) {
            if (except === '/') {
                if (path === '/') return true;
                continue;
            }
            if (path.startsWith(except)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine if the session and input tokens match.
     */
    protected async tokensMatch(request: Request): Promise<boolean> {
        const token = await this.getTokenFromRequest(request);
        const sessionToken = await request.session.get('_token');

        if (!token || !sessionToken || token.length !== sessionToken.length) {
            return false;
        }

        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
    }

    /**
     * Get the CSRF token from the request.
     */
    protected async getTokenFromRequest(request: Request): Promise<string | null> {
        const token = request.input('_token') || request.header('X-CSRF-TOKEN') || request.header('X-XSRF-TOKEN');
        
        if (!token) {
            return null;
        }

        return token;
    }

    /**
     * Determine if the HTTP request uses a read-only method.
     */
    protected isReading(request: Request): boolean {
        return ['GET', 'HEAD', 'OPTIONS'].includes(request.method());
    }

    /**
     * Determine if the application is running unit tests.
     */
    protected runningUnitTests(): boolean {
        return process.env.NODE_ENV === 'test';
    }

    /**
     * Add the CSRF token to the response cookies.
     */
    protected async addCookieToResponse(request: Request, response: Response): Promise<Response> {
        const token = await request.session.get('_token');
        if (token) {
            const config = (request as any).app.config();
            response.cookie('XSRF-TOKEN', token, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
                secure: config.get('session.secure', false)
            });
        }
        return response;
    }
}
