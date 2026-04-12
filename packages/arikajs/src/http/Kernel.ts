import { Application } from '../Contracts/Application';
import { Request, Response, NotFoundHttpException } from '@arikajs/http';
import { Pipeline } from '@arikajs/middleware';
import { Dispatcher } from '@arikajs/dispatcher';
import { RequestLoggingMiddleware } from './Middleware/RequestLoggingMiddleware';
import { BodyParserMiddleware, CorsMiddleware, TrimStrings, ConvertEmptyStringsToNull, SecurityHeaders, Throttle } from '@arikajs/http';
import { Handler } from './Handler';
import { ViewMiddleware } from './Middleware/ViewMiddleware';
import { VerifyCsrfToken } from './Middleware/VerifyCsrfToken';
import { ServeStaticMiddleware } from './Middleware/ServeStaticMiddleware';
import { StartSession } from '@arikajs/session';
import { Authenticate, EnsureEmailIsVerified } from '@arikajs/auth';
import { ResolveServerAction } from './Actions/ResolveServerAction';


export class Kernel {
    /**
     * The application's global HTTP middleware stack.
     */
    protected middleware: any[] = [
        new CorsMiddleware(),
        new SecurityHeaders(),
        new RequestLoggingMiddleware(),
        new BodyParserMiddleware(),
        new TrimStrings(),
        new ConvertEmptyStringsToNull(),
        new ServeStaticMiddleware(),
    ];

    /**
     * The application's route middleware groups.
     */
    protected middlewareGroups: Record<string, any[]> = {
        web: [
            StartSession,
            ViewMiddleware,
            VerifyCsrfToken,
            ResolveServerAction,
        ],
        api: [],
    };

    /**
     * The application's route middleware.
     */
    protected routeMiddleware: Record<string, any> = {
        'auth': Authenticate,
        'verified': EnsureEmailIsVerified,
        'throttle': Throttle,
    };

    protected handler: Handler;
    protected globalPipeline: Pipeline<Request, Response>;

    constructor(protected app: Application) {
        try {
            this.handler = this.app.make(Handler);
        } catch (e) {
            this.handler = new Handler();
        }

        // Pre-configure global pipeline for better performance
        this.globalPipeline = new Pipeline<Request, Response>(this.app.getContainer());
        this.globalPipeline.setMiddlewareGroups(this.middlewareGroups);
        this.globalPipeline.setAliases(this.routeMiddleware);
        this.globalPipeline.pipe(this.middleware);

        const router = this.app.getRouter();
        if ((router as any).setMiddlewareGroups) {
            (router as any).setMiddlewareGroups(this.middlewareGroups);
        }
        if ((router as any).setRouteMiddleware) {
            (router as any).setRouteMiddleware(this.routeMiddleware);
        }
    }

    protected fastPath: Map<string, Function> = new Map();
    protected patternWarp: { regex: RegExp, keys: string[], handler: Function }[] = [];

    /**
     * Handle an incoming HTTP request.
     */
    public handle(request: Request, response: Response): Promise<Response> | Response {
        // Elite HMR Silent Fast-Path: Bypass logging, middleware and rendering
        if (request.header('X-Arika-HMR') === 'check') {
            try {
                const view = this.app.make<any>('view');
                if (view && view.engine) {
                    response.header('X-Arika-State-Hash', view.engine().stateHash || '');
                    return response.status(204).send('');
                }
            } catch (e) { /* View not registered yet */ }
        }

        const path = (request as any).req.url;
        const method = request.method();

        if (method === 'GET') {
            try {
                // 1. O(1) Literal Warp
                const fastHandler = this.fastPath.get(path);
                if (fastHandler) {
                    const result = fastHandler(request, response);
                    return this.handleWarpResult(result, response);
                }

                // 2. Pattern Warp (High-speed dynamic jump)
                for (let i = 0; i < this.patternWarp.length; i++) {
                    const warp = this.patternWarp[i];
                    const match = warp.regex.exec(path);
                    if (match) {
                        const params: any = match.slice(1);
                        const result = warp.handler(request, response, params);
                        return this.handleWarpResult(result, response);
                    }
                }
            } catch (error) {
                // Route warp errors to the official Exception Handler for pretty UI rendering
                this.handler.report(error);
                return this.handler.render(request, error, response);
            }
        }

        return (this.app as any).runWithRequest(request, () => {
            try {
                const result = this.globalPipeline.handle(request, (req: Request) => {
                    return this.dispatchToRouter(req, response);
                }, response);

                if (result instanceof Promise) {
                    return result
                        .then(r => this.sendResponse(r, response))
                        .catch(error => {
                            this.handler.report(error);
                            return this.handler.render(request, error, response);
                        });
                }

                return this.sendResponse(result, response);
            } catch (error) {
                this.handler.report(error);
                return this.handler.render(request, error, response);
            }
        });
    }

    /**
     * Dispatch the request to the router.
     */
    protected dispatchToRouter(request: Request, response: Response): Promise<Response> | Response {
        const router = this.app.getRouter();

        const result = router.dispatch(request, response);

        if (result === null) {
            throw new NotFoundHttpException(`Route not found: [${request.method()}] ${request.path()}`);
        }

        if (result instanceof Promise) {
            return result.then(res => {
                if (res === null) throw new NotFoundHttpException(`Route not found: [${request.method()}] ${request.path()}`);
                return res as Response;
            });
        }

        return result as Response;
    }

    /**
     * Send the response back to the client.
     */
    protected sendResponse(result: any, response: Response): Response | Promise<Response> {
        if (result instanceof Promise) {
            return result.then(r => this.sendResponse(r, response));
        }

        // Handle actual Response objects
        if (result && typeof result.terminate === 'function') {
            result.terminate();
            return result;
        }

        // Handle raw results
        return (this.app as any).make('dispatcher').responseResolver.resolve(result, response);
    }

    /**
     * Internal helper to handle results from warp handlers (including Hyper-Buffers).
     */
    private handleWarpResult(result: any, response: Response): Response | Promise<Response> {
        if (result instanceof Buffer) {
            const rawRes = (response as any).res;
            rawRes.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': result.length
            });
            rawRes.end(result);
            return response;
        }

        if (result instanceof Promise) {
            return result.then(r => this.sendResponse(r, response));
        }
        return this.sendResponse(result, response);
    }

    /**
     * Actually terminate the request and send to client.
     */
    public terminate(request: Request, response: Response): void {
        response.terminate();
    }
}
