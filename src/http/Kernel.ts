import { Application } from '../Application';
import { Request, Response } from '@arikajs/http';
import { Pipeline } from '@arikajs/middleware';
import { Dispatcher } from '@arikajs/dispatcher';
import { RequestLoggingMiddleware } from './Middleware/RequestLoggingMiddleware';
import { BodyParserMiddleware } from '@arikajs/http';
import { Handler } from './Handler';

export class Kernel {
    /**
     * The application's global HTTP middleware stack.
     */
    protected middleware: any[] = [
        new RequestLoggingMiddleware(),
        new BodyParserMiddleware(),
    ];

    protected handler: Handler;

    constructor(protected app: Application) {
        this.handler = new Handler();
    }

    /**
     * Handle an incoming HTTP request.
     */
    public async handle(request: Request, response: Response): Promise<Response> {
        try {
            return await (new Pipeline<Request, Response>(this.app.getContainer()))
                .pipe(this.middleware)
                .handle(request, async (req: Request) => {
                    return this.dispatchToRouter(req, response);
                }, response);
        } catch (error: any) {
            this.handler.report(error);
            return this.handler.render(request, error, response);
        }
    }

    /**
     * Dispatch the request to the router.
     */
    protected async dispatchToRouter(request: Request, response: Response): Promise<Response> {
        const router = this.app.getRouter();
        const matched = router.match(request.method(), request.path());

        if (!matched) {
            return response.status(404).json({ error: 'Route not found' });
        }

        const dispatcher = new Dispatcher(this.app.getContainer());
        return await dispatcher.dispatch(matched, request, response);
    }

    /**
     * Send the response back to the client.
     */
    public terminate(request: Request, response: Response): void {
        response.terminate();
    }
}
