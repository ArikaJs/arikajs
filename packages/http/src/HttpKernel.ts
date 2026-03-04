import { IncomingMessage, ServerResponse } from 'node:http';
import { Application } from './Contracts/Application';
import { Request } from './Request';
import { Response } from './Response';
import { Pipeline } from './Pipeline';
import { Router } from './Router';

export class HttpKernel {
    protected middleware: any[] = [];
    protected router: Router;

    constructor(protected app: Application) {
        this.router = new Router();
    }

    /**
     * Get the router instance.
     */
    public getRouter(): Router {
        return this.router;
    }

    /**
     * Set the router instance.
     */
    public setRouter(router: Router): void {
        this.router = router;
    }

    /**
     * Add global middleware.
     */
    public use(middleware: any): this {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Handle an incoming HTTP request.
     */
    public async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            const request = new Request(this.app, req);
            const response = new Response(res);

            const result = await this.sendRequestThroughRouter(request, response);

            result.terminate();
        } catch (error) {
            this.handleException(error, res);
        }
    }

    /**
     * Send the given request through the middleware / router.
     */
    protected async sendRequestThroughRouter(request: Request, response: Response): Promise<Response> {
        return (new Pipeline(this.app.getContainer()))
            .pipe(this.middleware)
            .handle(request, (req) => this.dispatchToRouter(req, response), response);
    }

    /**
     * Dispatch the request to the router.
     */
    protected async dispatchToRouter(request: Request, response: Response): Promise<Response> {
        return this.router.dispatch(request, response);
    }

    /**
     * Handle an exception during request execution.
     */
    protected handleException(error: any, res: ServerResponse): void {
        const response = new Response(res);

        const status = error.statusCode || error.status || 500;

        response.status(status).json({
            message: error.message || 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        response.terminate();
    }
}
