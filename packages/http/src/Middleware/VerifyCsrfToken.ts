
import { Request } from '../Request';
import { Response } from '../Response';
import { Middleware } from '../Middleware';
import { TokenMismatchHttpException } from '../Exceptions/HttpException';

/**
 * Verify CSRF Token Middleware.
 */
export class VerifyCsrfToken implements Middleware {
    /**
     * The URIs that should be excluded from CSRF verification.
     */
    protected except: string[] = [];

    /**
     * Handle the incoming request.
     */
    public async handle(
        request: Request,
        next: (request: Request) => Promise<Response>,
        response?: Response
    ): Promise<Response> {
        if (
            this.isReading(request) ||
            this.inExceptArray(request) ||
            await this.tokensMatch(request)
        ) {
            return next(request);
        }

        throw new TokenMismatchHttpException();
    }

    /**
     * Determine if the HTTP request uses a ‘read’ verb.
     */
    protected isReading(request: Request): boolean {
        return ['GET', 'HEAD', 'OPTIONS'].includes(request.method());
    }

    /**
     * Determine if the request has a URI that should pass through CSRF verification.
     */
    protected inExceptArray(request: Request): boolean {
        const path = request.path();
        return this.except.some(pattern => {
            const regex = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
            return regex.test(path);
        });
    }

    /**
     * Determine if the session and input CSRF tokens match.
     */
    protected async tokensMatch(request: Request): Promise<boolean> {
        const token = request.input('_token') || 
                      request.header('X-CSRF-TOKEN') || 
                      request.header('X-XSRF-TOKEN');
                      
        const session = request.session;

        if (!session || typeof session.token !== 'function') {
            // If session is not active or token method missing, fail for non-read requests
            return false;
        }

        const sessionToken = await session.token();
        
        return typeof token === 'string' && token === sessionToken;
    }
}
