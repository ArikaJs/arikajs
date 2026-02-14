import { Application } from '../Contracts/Application';
import { Request, Response, NotFoundHttpException } from '@arikajs/http';
import { Pipeline } from '@arikajs/middleware';
import { Dispatcher } from '@arikajs/dispatcher';
import { RequestLoggingMiddleware } from './Middleware/RequestLoggingMiddleware';
import { BodyParserMiddleware, CorsMiddleware } from '@arikajs/http';
import { Handler } from './Handler';

export class Kernel {
    /**
     * The application's global HTTP middleware stack.
     */
    protected middleware: any[] = [
        new CorsMiddleware(),
        new RequestLoggingMiddleware(),
        new BodyParserMiddleware(),
    ];

    /**
     * The application's route middleware groups.
     */
    protected middlewareGroups: Record<string, any[]> = {
        web: [],
        api: [],
    };

    /**
     * The application's route middleware.
     */
    protected routeMiddleware: Record<string, any> = {};

    protected handler: Handler;

    constructor(protected app: Application) {
        try {
            this.handler = this.app.make(Handler);
        } catch (e) {
            this.handler = new Handler();
        }
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
            throw new NotFoundHttpException(`Route not found: [${request.method()}] ${request.path()}`);
        }

        const dispatcher = new Dispatcher(this.app.getContainer());
        dispatcher.setMiddlewareGroups(this.middlewareGroups);
        dispatcher.setRouteMiddleware(this.routeMiddleware);

        return await dispatcher.dispatch(matched, request, response) as Response;
    }

    /**
     * Send the response back to the client.
     */
    public terminate(request: Request, response: Response): void {
        response.terminate();
    }
}
