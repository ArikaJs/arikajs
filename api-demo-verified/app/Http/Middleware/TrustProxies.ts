import { Request, Response, Middleware } from 'arikajs';

export class TrustProxies implements Middleware {
    /**
     * The trusted proxies for the application.
     * Use '*' to trust all proxies, or an array of IP addresses.
     */
    protected proxies: string | string[] = '*';

    /**
     * The proxy header mappings.
     */
    protected headers: string = 'X-Forwarded-For | X-Forwarded-Host | X-Forwarded-Proto';

    /**
     * Handle an incoming request.
     */
    public async handle(request: Request, next: (request: Request) => Promise<Response>): Promise<Response> {
        // In ArikaJS, proxy trust is currently configured in the config/http.ts file,
        // but this middleware can be used to dynamically set trust logic if needed.
        return await next(request);
    }
}
