import { Request } from './Request';
import { Response } from './Response';
import { Pipeline } from './Pipeline';

export type RouteAction = any;

export interface Route {
    method: string;
    path: string;
    action: RouteAction;
    middleware: any[];
}

export class Router {
    protected routes: Route[] = [];
    protected groupStack: any[] = [];
    protected middlewareGroups: Record<string, any[]> = {};

    public group(attributes: any, callback: (router: Router) => void): void {
        this.groupStack.push(attributes);
        callback(this);
        this.groupStack.pop();
    }

    public get(path: string, action: RouteAction): this {
        return this.addRoute('GET', path, action);
    }

    public post(path: string, action: RouteAction): this {
        return this.addRoute('POST', path, action);
    }

    public put(path: string, action: RouteAction): this {
        return this.addRoute('PUT', path, action);
    }

    public delete(path: string, action: RouteAction): this {
        return this.addRoute('DELETE', path, action);
    }

    public patch(path: string, action: RouteAction): this {
        return this.addRoute('PATCH', path, action);
    }

    public options(path: string, action: RouteAction): this {
        return this.addRoute('OPTIONS', path, action);
    }

    /**
     * Add middleware to the last registered route.
     */
    public middleware(middleware: any | any[]): this {
        const lastRoute = this.routes[this.routes.length - 1];
        if (lastRoute) {
            if (Array.isArray(middleware)) {
                lastRoute.middleware.push(...middleware);
            } else {
                lastRoute.middleware.push(middleware);
            }
        }
        return this;
    }

    protected addRoute(method: string, path: string, action: RouteAction): this {
        const attributes = this.mergeGroupAttributes();
        const fullPath = this.prefixPath(attributes.prefix, path);
        const middleware = [...(attributes.middleware || [])];

        this.routes.push({
            method,
            path: fullPath,
            action,
            middleware
        });
        return this;
    }

    protected mergeGroupAttributes(): any {
        const attributes: any = { prefix: '', middleware: [] };

        for (const group of this.groupStack) {
            if (group.prefix) {
                attributes.prefix = this.prefixPath(attributes.prefix, group.prefix);
            }
            if (group.middleware) {
                attributes.middleware = [...attributes.middleware, ...group.middleware];
            }
        }

        return attributes;
    }

    protected prefixPath(prefix: string, path: string): string {
        const cleanedPrefix = prefix.replace(/\/+$/, '');
        const cleanedPath = path.replace(/^\/+/, '');

        if (!cleanedPrefix) return cleanedPath.startsWith('/') ? cleanedPath : '/' + cleanedPath;
        return cleanedPrefix + '/' + cleanedPath;
    }

    public async dispatch(request: Request, response: Response): Promise<Response> {
        const route = this.findRoute(request);

        if (!route) {
            return response.status(404).json({ error: 'Route not found' });
        }

        const pipeline = new Pipeline(request.getApplication().getContainer());

        return pipeline
            .pipe(route.middleware)
            .handle(request, (req) => this.runRoute(route, req, response), response);
    }

    protected findRoute(request: Request): Route | null {
        const path = request.path();
        const method = request.method().toUpperCase();

        for (const route of this.routes) {
            if (route.method === method && this.matchPath(route.path, path, request)) {
                return route;
            }
        }

        return null;
    }

    protected matchPath(routePath: string, requestPath: string, request: Request): boolean {
        // Simple parameter matching: /users/:id
        const routeParts = routePath.split('/').filter(Boolean);
        const requestParts = requestPath.split('/').filter(Boolean);

        if (routeParts.length !== requestParts.length) {
            return false;
        }

        const params: Record<string, string> = {};

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = requestParts[i];
                continue;
            }

            if (routeParts[i] !== requestParts[i]) {
                return false;
            }
        }

        request.setParams(params);
        return true;
    }

    protected async runRoute(route: Route, request: Request, response: Response): Promise<Response> {
        const action = route.action;

        if (typeof action === 'function') {
            const result = await action(request, ...Object.values(request.params()));
            return this.toResponse(result, response);
        }

        if (Array.isArray(action)) {
            const [controllerClass, methodName] = action;
            const controller = request.getApplication().make(controllerClass);
            const result = await controller[methodName](request, ...Object.values(request.params()));
            return this.toResponse(result, response);
        }

        throw new Error('Invalid route action');
    }

    private toResponse(result: any, response: Response): Response {
        if (result instanceof Response) {
            return result;
        }

        if (typeof result === 'object') {
            return response.json(result);
        }

        if (typeof result === 'string') {
            return response.send(result);
        }

        return response;
    }
}
