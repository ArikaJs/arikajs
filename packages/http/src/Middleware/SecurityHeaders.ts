import { Request, Response } from '../index';
import { Middleware } from '../Middleware';

/**
 * Sets essential HTTP security headers to protect the application.
 */
export class SecurityHeaders implements Middleware {
    /**
     * Handle the incoming request.
     */
    public async handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> {
        const res = await next(request);
        const config = request.getApplication().config();

        // Standard security headers with configurable overrides
        res.header('X-Content-Type-Options', config.get('http.security.contentTypeOptions', 'nosniff'));
        res.header('X-Frame-Options', config.get('http.security.frameOptions', 'SAMEORIGIN'));
        res.header('X-XSS-Protection', config.get('http.security.xssProtection', '1; mode=block'));
        res.header('Referrer-Policy', config.get('http.security.referrerPolicy', 'strict-origin-when-cross-origin'));
        res.header('Permissions-Policy', config.get('http.security.permissionsPolicy', 'camera=(), microphone=(), geolocation=()'));

        if (process.env.NODE_ENV === 'production' || config.get('http.security.hsts', false)) {
            res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Configuration-driven CSP
        const defaultCsp = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            'img-src': ["'self'", "data:"],
            'font-src': ["'self'", "https://fonts.gstatic.com"],
            'connect-src': ["'self'"]
        };

        const configCsp = config.get('http.security.csp', defaultCsp);
        
        if (configCsp) {
            const cspHeader = typeof configCsp === 'string' 
                ? configCsp 
                : this.formatCsp(configCsp);
            res.header('Content-Security-Policy', cspHeader);
        }

        return res;
    }

    /**
     * Format a CSP object into a standard header string.
     */
    private formatCsp(csp: Record<string, string[]>): string {
        return Object.entries(csp)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');
    }
}
