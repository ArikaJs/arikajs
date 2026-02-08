
import { Application as FoundationApplication } from '@arikajs/foundation';
import { Router, Route } from '@arikajs/router';
import { FrameworkServiceProvider } from './providers/FrameworkServiceProvider';

export class Application extends FoundationApplication {
    protected router: Router;

    constructor(basePath: string = process.cwd()) {
        super(basePath);

        // Initialize Core Components
        this.router = new Router();

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

        console.log(`ArikaJS application listening on http://localhost:${port}`);

        // This is a placeholder for actual server start logic
        // which would involve @arikajs/http and @arikajs/dispatcher
    }

    /**
     * Get the router instance.
     */
    public getRouter(): Router {
        return this.router;
    }
}
