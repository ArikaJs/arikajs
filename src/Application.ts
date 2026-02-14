import { Application as FoundationApplication } from '@arikajs/foundation';
import { Router, Route } from '@arikajs/router';
import { FrameworkServiceProvider } from './providers/FrameworkServiceProvider';
import { Log } from '@arikajs/logging';

export class Application extends FoundationApplication {
    protected router: Router;

    constructor(basePath: string = process.cwd()) {
        super(basePath);

        // Initialize Core Components
        this.router = new Router(this.getContainer());

        // Register within container
        this.instance(Router, this.router);

        // Register Core Framework Provider
        this.register(FrameworkServiceProvider);
    }

    /**
     * Map a GET route.
     */
    public get(path: string, handler: any) {
        return Route.get(path, handler);
    }

    /**
     * Map a POST route.
     */
    public post(path: string, handler: any) {
        return Route.post(path, handler);
    }

    /**
     * Map a PUT route.
     */
    public put(path: string, handler: any) {
        return Route.put(path, handler);
    }

    /**
     * Map a DELETE route.
     */
    public delete(path: string, handler: any) {
        return Route.delete(path, handler);
    }

    /**
     * Start the HTTP server.
     */
    public async listen(port: number = 3000) {
        if (!this.isBooted()) {
            await this.boot();
        }

        const http = await import('node:http');
        const { Request, Response, Pipeline } = await import('@arikajs/http');
        // @ts-ignore
        const { BodyParserMiddleware } = await import('@arikajs/http/dist/Middleware/BodyParserMiddleware');
        // @ts-ignore
        const { RequestLoggingMiddleware } = await import('./http/Middleware/RequestLoggingMiddleware');

        const server = http.createServer(async (req, res) => {
            const request = new Request(this, req);
            const response = new Response(res);

            try {
                // Setup middleware pipeline
                const pipeline = new Pipeline();

                // Add default middlewares
                pipeline.pipe(new RequestLoggingMiddleware());
                pipeline.pipe(new BodyParserMiddleware());

                // Execute pipeline
                const finalResponse = await pipeline.handle(request, async (req) => {
                    const result = await this.router.dispatch(req);

                    if (result instanceof Response) {
                        return result;
                    }

                    if (typeof result === 'object' && result !== null) {
                        return response.json(result);
                    }

                    return response.send(String(result || ''));
                });

                finalResponse.terminate();
            } catch (error: any) {
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
                }
            }
        });

        return new Promise<void>((resolve) => {
            server.listen(port, () => {
                Log.info(`ArikaJS application listening on http://localhost:${port}`);
                resolve();
            });
        });
    }

    /**
     * Get the router instance.
     */
    public getRouter(): Router {
        return this.router;
    }
}
