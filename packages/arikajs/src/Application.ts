import { Application as FoundationApplication } from '@arikajs/foundation';
import { Router, Route } from '@arikajs/router';
import { FrameworkServiceProvider } from './providers/FrameworkServiceProvider';
import { Log } from '@arikajs/logging';
import { Application as ApplicationContract } from './Contracts/Application';
import { setApp } from './helpers';

export class Application extends FoundationApplication implements ApplicationContract {
    public static readonly VERSION = '0.0.5';

    protected router: Router;
    protected server?: any;
    protected isTerminating: boolean = false;

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

    public async boot(): Promise<void> {
        if (this.isBooted()) return;
        await super.boot();
        (this.router as any).sync();
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
        const callback = this.getCallback();

        this.server = http.createServer(callback);

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
     * Get the HTTP server callback for raw http.createServer() usage.
     */
    public getCallback() {
        if (!this.isBooted()) {
            throw new Error('Application must be booted before calling getCallback()');
        }

        const { Kernel } = require('./http/Kernel');
        const kernel = this.make(Kernel);
        const { ObjectPool } = require('@arikajs/foundation');
        const { Request: ArikaRequest, Response: ArikaResponse, RawResponse } = require('@arikajs/http');

        const requestPool = new ObjectPool(
            () => new (ArikaRequest as any)(this, null),
            (obj: any) => obj.reset(null)
        );
        const responsePool = new ObjectPool(
            () => new (ArikaResponse as any)(null),
            (obj: any) => obj.reset(null)
        );

        return (req: any, res: any) => {
            const request = requestPool.acquire();
            const response = responsePool.acquire();
            request.reset(req);
            response.reset(res);

            const handleRequest = async () => {
                try {
                    const finalResponse = await (kernel as any).handle(request, response);
                    (kernel as any).terminate(request, finalResponse);
                } catch (error: any) {
                    if (!res.headersSent) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
                    }
                } finally {
                    requestPool.release(request);
                    responsePool.release(response);
                }
            };
            handleRequest();
        };
    }

    /**
     * Gracefully terminate the application.
     */
    public async terminate() {
        if (this.isTerminating) return;
        this.isTerminating = true;

        if (this.server) {
            // Close all active connections to speed up shutdown (Node 18.2+)
            if (typeof this.server.closeAllConnections === 'function') {
                this.server.closeAllConnections();
            }

            // Force close idle connections
            if (typeof this.server.closeIdleConnections === 'function') {
                this.server.closeIdleConnections();
            }

            await new Promise<void>((resolve) => {
                // Set a timeout to force resolve if server doesn't close in time
                const timeout = setTimeout(() => {
                    Log.warning('HTTP server forced to close due to timeout.');
                    resolve();
                }, 1000);

                this.server.close(() => {
                    clearTimeout(timeout);
                    Log.info('HTTP server closed.');
                    resolve();
                });
            });
        }

        // Close database connections
        if (this.has('db')) {
            try {
                const db = this.make<any>('db');
                if (typeof db.closeAll === 'function') {
                    await db.closeAll();
                }
            } catch (e) { }
        }

        // Potential for other service termination (Queues, etc.)

        // Remove signal listeners to prevent double triggers during exit
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');

        // If we are in a testing or specific environment, we might not want to exit
        if (process.env.NODE_ENV !== 'test') {
            // Give a short delay for logs to flush before exiting
            setTimeout(() => {
                process.exit(0);
            }, 50);
        }
    }

    /**
     * Get the router instance.
     */
    public getRouter(): Router {
        return this.router;
    }
}
