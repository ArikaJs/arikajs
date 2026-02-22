import { Application as FoundationApplication } from '@arikajs/foundation';
import { Router, Route } from '@arikajs/router';
import { FrameworkServiceProvider } from './providers/FrameworkServiceProvider';
import { Log } from '@arikajs/logging';
import { Application as ApplicationContract } from './Contracts/Application';
import { setApp } from './helpers';

export class Application extends FoundationApplication implements ApplicationContract {
    public static readonly VERSION = '0.0.4';

    protected router: Router;
    protected server?: any;

    constructor(basePath: string = process.cwd()) {
        super(basePath);
        setApp(this);

        // Initialize Core Components
        this.router = new Router(this.getContainer());

        // Register within container
        this.instance(Router, this.router);

        // Register Core Framework Provider
        this.register(FrameworkServiceProvider);
    }

    public version(): string {
        return Application.VERSION;
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

    public patch(path: string, handler: any) {
        return Route.patch(path, handler);
    }

    /**
     * Map a DELETE route.
     */
    public delete(path: string, handler: any) {
        return Route.delete(path, handler);
    }

    public options(path: string, handler: any) {
        return Route.options(path, handler);
    }

    public match(methods: string[], path: string, handler: any) {
        return Route.match(methods, path, handler);
    }

    /**
     * Start the HTTP server.
     */
    public async listen(port: number = 3000) {
        if (!this.isBooted()) {
            await this.boot();
        }

        const http = await import('node:http');
        const { Request, Response } = await import('@arikajs/http');
        const { Kernel } = await import('./http/Kernel');

        // Resolve Kernel from the container
        const kernel = this.make(Kernel);

        this.server = http.createServer(async (req, res) => {
            const request = new Request(this, req);
            const response = new Response(res);

            try {
                const finalResponse = await kernel.handle(request, response);
                kernel.terminate(request, finalResponse);
            } catch (error: any) {
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Internal Server Error',
                        message: error.message,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                    }));
                }
            }
        });

        // Graceful shutdown
        const shutdown = () => this.terminate();
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        return new Promise<void>((resolve) => {
            this.server.listen(port, () => {
                this.displayBanner(port);
                resolve();
            });
        });
    }

    protected displayBanner(port: number) {
        const env = this.config().get('app.env', 'development');

        console.log(`\x1b[38;5;99m
     _         _ _              _ ____  
    / \\   _ __(_) | ____ _     | / ___| 
   / _ \\ | '__| | |/ / _\` |    | \\___ \\ 
  / ___ \\| |  | |   < (_| |  __| |___) |
 /_/   \\_\\_|  |_|_|\\_\\__,_| |____|____/ 
\x1b[0m`);
        console.log(` \x1b[1mArikaJS Framework\x1b[0m \x1b[38;5;99mv${this.version()}\x1b[0m`);
        console.log(` \x1b[90mEnvironment:\x1b[0m \x1b[33m${env}\x1b[0m`);
        console.log(` \x1b[90mLocal URL:\x1b[0m   \x1b[36mhttp://localhost:${port}\x1b[0m`);
        console.log('');
    }

    /**
     * Gracefully terminate the application.
     */
    public async terminate() {
        if (this.server) {
            await new Promise<void>((resolve) => {
                this.server.close(() => {
                    Log.info('HTTP server closed.');
                    resolve();
                });
            });
        }

        // Potential for other service termination (DB, Queues, etc.)
        // This is where we would call something like this.getContainer().terminate()

        process.exit(0);
    }

    /**
     * Get the router instance.
     */
    public getRouter(): Router {
        return this.router;
    }
}
