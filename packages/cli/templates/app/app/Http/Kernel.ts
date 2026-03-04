import { Kernel as BaseKernel } from 'arikajs';
import { CorsMiddleware } from './Middleware/CorsMiddleware';
import { SecurityHeadersMiddleware } from './Middleware/SecurityHeadersMiddleware';
import { TrimStringsMiddleware } from './Middleware/TrimStringsMiddleware';
import { ThrottleMiddleware } from './Middleware/ThrottleMiddleware';
import { ExampleMiddleware } from './Middleware/ExampleMiddleware';

export class Kernel extends BaseKernel {
    /**
     * Global middleware — runs on EVERY request (web + API).
     *
     * Good candidates: CORS, security headers, request trimming.
     */
    constructor(app: any) {
        super(app);
        // Combine base framework middleware (BodyParser, Logging, etc.) with app-specific global middleware
        (this as any).middleware.push(
            new CorsMiddleware(),           // Handle cross-origin requests (needed for SPA frontends)
            new SecurityHeadersMiddleware(), // Set X-Frame-Options, CSP, HSTS, etc.
            new TrimStringsMiddleware()      // Trim whitespace from all string inputs automatically
        );
    }

    /**
     * Middleware groups — applied by route file or route group.
     *
     * 'web'  → for browser-facing routes (HTML pages, sessions, CSRF)
     * 'api'  → for stateless API routes (JSON responses)
     */
    protected middlewareGroups = {
        web: [
            // CorsMiddleware and SecurityHeadersMiddleware already run globally above.
            // Add session / CSRF middleware here when available.
            new ExampleMiddleware(),
        ],
        api: [
            // API routes are stateless (JWT-based auth).
            // Global throttle for the whole API: 120 req / 60s per IP.
            new ThrottleMiddleware(120, 60),
        ],
    };

    /**
     * Named route middleware — use with .withMiddleware('name') on individual routes.
     * Use arguments like 'throttle:login' or 'throttle:120,60'.
     */
    protected routeMiddleware = {
        // Authentication (populated by auth:install commands)
        // 'auth': Authenticate,

        'throttle': ThrottleMiddleware,
    };
}
