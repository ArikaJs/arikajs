import { Request, Response } from './Contracts/Http';
import { MatchedRoute } from './Contracts/Router';
import { ControllerResolver } from './ControllerResolver';
import { MethodInvoker } from './MethodInvoker';
import { ResponseResolver } from './ResponseResolver';
import { Pipeline } from '@arikajs/middleware';

export class Dispatcher {
    private controllerResolver?: ControllerResolver;
    private invoker: MethodInvoker;
    private responseResolver: ResponseResolver;
    private middlewareGroups: Record<string, any[]> = {};
    private routeMiddleware: Record<string, any> = {};
    private parameterBinders: Map<string, (value: any) => Promise<any>> = new Map();
    private exceptionHandler?: (error: any, request: Request, response: Response) => any;

    constructor(private container?: any) {
        this.invoker = new MethodInvoker(container);
        this.responseResolver = new ResponseResolver();
        if (container) {
            this.controllerResolver = new ControllerResolver(container);
        }
    }

    /**
     * Set the container for resolving controllers.
     */
    public setContainer(container: any): this {
        this.container = container;
        this.controllerResolver = new ControllerResolver(container);
        this.invoker.setContainer(container);
        return this;
    }

    /**
     * Set a global exception handler to catch and format errors from route execution.
     */
    public setExceptionHandler(handler: (error: any, request: Request, response: Response) => any): this {
        this.exceptionHandler = handler;
        return this;
    }

    /**
     * Set the middleware groups mapping.
     */
    public setMiddlewareGroups(groups: Record<string, any[]>): this {
        this.middlewareGroups = groups;
        return this;
    }

    /**
     * Set the route middleware mapping.
     */
    public setRouteMiddleware(middleware: Record<string, any>): this {
        this.routeMiddleware = middleware;
        return this;
    }

    /**
     * Register a route parameter binder.
     */
    public bind(key: string, resolver: any): this {
        if (resolver && typeof resolver.findOrFail === 'function') {
            this.parameterBinders.set(key, (value) => resolver.findOrFail(value));
        } else {
            this.parameterBinders.set(key, resolver);
        }
        return this;
    }

    /**
     * Dispatch the matched route to its handler.
     */
    public async dispatch(
        matchedRoute: MatchedRoute,
        request: Request,
        response: Response
    ): Promise<Response> {
        const { route, params } = matchedRoute;
        const handler = route.handler;

        // Set parameters on the request object
        if (typeof request.setParams === 'function') {
            request.setParams(params);
        }

        // 0. Resolve Route Parameters (Model Binding)
        const resolvedParams = await this.resolveParameters(params);

        // 1. Resolve Handler
        let resolvedHandler: Function | { controller: any; method: string };
        let controllerMiddleware: any[] = [];

        if (Array.isArray(handler)) {
            if (!this.controllerResolver) {
                throw new Error('Container required for controller resolution.');
            }
            const resolved = this.controllerResolver.resolve(handler);
            resolvedHandler = resolved;

            // Extract controller-level middleware
            if (typeof resolved.controller.getMiddleware === 'function') {
                controllerMiddleware = resolved.controller.getMiddleware() || [];
            } else if (resolved.controller.constructor && resolved.controller.constructor.middleware) {
                controllerMiddleware = resolved.controller.constructor.middleware;
            }
        } else if (typeof handler === 'function') {
            resolvedHandler = handler;
        } else {
            throw new Error('Invalid route handler.');
        }

        // 2. Prepare Middleware Pipeline
        const pipeline = new Pipeline<Request, Response>(this.container);
        pipeline.setMiddlewareGroups(this.middlewareGroups);
        pipeline.setAliases(this.routeMiddleware);

        // Add route-level middleware
        if (route.middleware && route.middleware.length > 0) {
            pipeline.pipe(route.middleware);
        }

        // Add controller-level middleware
        if (controllerMiddleware && controllerMiddleware.length > 0) {
            pipeline.pipe(controllerMiddleware);
        }

        // 3. Execute Pipeline
        try {
            return await pipeline.handle(request, async (req: Request) => {
                // 4. Invoke Handler
                const result = await this.invoker.invoke(resolvedHandler, req, response, resolvedParams);

                // 5. Normalize Response
                return await this.responseResolver.resolve(result, response);
            }, response);
        } catch (error) {
            if (this.exceptionHandler) {
                const handledResult = await this.exceptionHandler(error, request, response);
                return await this.responseResolver.resolve(handledResult, response);
            }
            throw error;
        }
    }

    /**
     * Resolve route parameters using registered binders.
     */
    private async resolveParameters(params: Record<string, any>): Promise<Record<string, any>> {
        const resolved = { ...params };

        for (const [key, value] of Object.entries(params)) {
            if (this.parameterBinders.has(key)) {
                const resolver = this.parameterBinders.get(key)!;
                resolved[key] = await resolver(value);
            }
        }

        return resolved;
    }
}
