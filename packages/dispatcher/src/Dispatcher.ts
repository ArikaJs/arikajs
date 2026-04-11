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
    public executionPlans: Map<any, any> = new Map();

    constructor(private container?: any) {
        this.invoker = new MethodInvoker(container);
        this.responseResolver = new ResponseResolver();
        if (container) {
            this.controllerResolver = new ControllerResolver(container);
        }
    }

    public precompile(routes: any[]) {
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const handler = route.handler;
            let resolvedHandler: any;
            let controllerMiddleware: any[] = [];

            if (Array.isArray(handler)) {
                if (this.controllerResolver) {
                    try {
                        const resolved = this.controllerResolver.resolve(handler);
                        resolvedHandler = resolved;
                        if (typeof resolved.controller.getMiddleware === 'function') {
                            controllerMiddleware = resolved.controller.getMiddleware() || [];
                        } else if (resolved.controller.constructor && resolved.controller.constructor.middleware) {
                            controllerMiddleware = resolved.controller.constructor.middleware;
                        }
                    } catch (e) {
                        // Skip if cannot resolve at boot (e.g. missing container)
                        continue;
                    }
                } else {
                    continue;
                }
            } else {
                resolvedHandler = handler;
            }

            const hasMiddleware = (route.middleware && route.middleware.length > 0) || (controllerMiddleware && controllerMiddleware.length > 0);
            const middleware = hasMiddleware ? [...(route.middleware || []), ...(controllerMiddleware || [])] : [];
            
            let pipeline: Pipeline<Request, Response> | null = null;
            if (hasMiddleware) {
                pipeline = new Pipeline<Request, Response>(this.container);
                pipeline.setMiddlewareGroups(this.middlewareGroups);
                pipeline.setAliases(this.routeMiddleware);
                pipeline.pipe(middleware);
            }

            this.executionPlans.set(route, {
                route,
                hasMiddleware,
                controllerMiddleware,
                resolvedHandler,
                pipeline,
                handler: (req: any, res: any, params: any) => this.invoker.invoke(resolvedHandler, req, res, params),
                middleware
            });

            // Pre-serialize simple responses if possible (only if handler takes no arguments)
            if (!hasMiddleware && typeof resolvedHandler === 'function' && resolvedHandler.length === 0) {
                try {
                    const result = resolvedHandler();
                    if (result && typeof result === 'object' && !(result instanceof Promise)) {
                        this.responseResolver.bufferCache.set(route, Buffer.from(JSON.stringify(result)));
                    }
                } catch (e) { }
            }
        }
    }

    /**
     * Set the container for resolving controllers.
     */
    public setContainer(container: any): this {
        this.container = container;
        this.controllerResolver = new ControllerResolver(container);
        this.invoker.setContainer(container);
        
        // Update existing execution plans with the new container
        for (const plan of this.executionPlans.values()) {
            if (plan.pipeline) {
                (plan.pipeline as any).container = container;
            }
        }
        
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
        
        // Update existing execution plans
        for (const plan of this.executionPlans.values()) {
            if (plan.pipeline) {
                plan.pipeline.setMiddlewareGroups(groups);
            }
        }
        
        return this;
    }

    /**
     * Set the route middleware mapping.
     */
    public setRouteMiddleware(middleware: Record<string, any>): this {
        this.routeMiddleware = middleware;
        
        // Update existing execution plans
        for (const plan of this.executionPlans.values()) {
            if (plan.pipeline) {
                plan.pipeline.setAliases(middleware);
            }
        }
        
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
    public dispatch(
        matchedRoute: MatchedRoute,
        request: Request,
        response: Response
    ): Promise<Response> | Response {
        const { route, params } = matchedRoute;
        
        // Lazy-params: If params is an array, we'll map it only when requested
        const paramValues = Array.isArray(params) ? params : Object.values(params);

        if (typeof request.setParams === 'function') {
            // Internally, our Request object now handles both array and record
            request.setParams(params);
        }

        if (typeof (request as any).setRoute === 'function') {
            (request as any).setRoute(route);
        }

        // 0. Resolve Route Parameters (Model Binding) - only if we have binders
        if (this.parameterBinders.size > 0 && !Array.isArray(params)) {
            return this.resolveParameters(params).then(resolvedParams => {
                return this.execute(route, request, response, resolvedParams);
            });
        }

        return this.execute(route, request, response, params);
    }

    /**
     * Internal execution of the route plan.
     */
    private execute(route: any, request: Request, response: Response, params: any): Promise<Response> | Response {
        // 1. Resolve Handler & Pipeline from Execution Plan
        let resolvedHandler: any;
        let pipeline: Pipeline<Request, Response> | null = null;

        const plan = this.executionPlans.get(route);
        if (plan) {
            resolvedHandler = plan.resolvedHandler;
            pipeline = plan.pipeline;
        } else {
            // Fallback for non-plan routes (safety)
            const handler = route.handler;
            let controllerMiddleware: any[] = [];
            
            if (Array.isArray(handler)) {
                if (!this.controllerResolver) {
                    throw new Error('Container required for controller resolution.');
                }
                const resolved = this.controllerResolver.resolve(handler);
                resolvedHandler = resolved;

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
            
            const middleware = [...(route.middleware || []), ...controllerMiddleware];
            if (middleware.length > 0) {
                pipeline = new Pipeline<Request, Response>(this.container);
                pipeline.setMiddlewareGroups(this.middlewareGroups);
                pipeline.setAliases(this.routeMiddleware);
                pipeline.pipe(middleware);
            }
        }

        // 2. Execute Pipeline or direct handler
        try {
            const executeAndResolve = (req: Request, res?: Response): Promise<Response> | Response => {
                const finalRes = res || response;
                const result = this.invoker.invoke(resolvedHandler, req, finalRes, params, route);
                
                if (result instanceof Promise) {
                    return result.then(r => this.responseResolver.resolve(r, finalRes, route));
                }
                return this.responseResolver.resolve(result, finalRes, route);
            };

            if (pipeline) {
                const result = pipeline.handle(request, executeAndResolve as any, response);
                if (result instanceof Promise) {
                    return result.catch(error => this.handleException(error, request, response));
                }
                return result;
            }

            const result = executeAndResolve(request, response);
            if (result instanceof Promise) {
                return result.catch(error => this.handleException(error, request, response));
            }
            return result;
        } catch (error) {
            return this.handleException(error, request, response);
        }
    }

    /**
     * Handle an exception using the registered handler or rethrow.
     */
    private handleException(error: any, request: Request, response: Response): Promise<Response> | Response {
        if (this.exceptionHandler) {
            const result = this.exceptionHandler(error, request, response);
            if (result instanceof Promise) {
                return result.then(r => this.responseResolver.resolve(r, response));
            }
            return this.responseResolver.resolve(result, response);
        }
        throw error;
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
