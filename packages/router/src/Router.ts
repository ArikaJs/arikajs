import { Request, Response } from '@arikajs/http';
import { RouteMatcher } from './RouteMatcher';
import { Dispatcher } from '@arikajs/dispatcher';
import { MatchedRoute, Container } from './types';
import { RouteRegistry } from './RouteRegistry';

export class Router {
    private matcher: RouteMatcher;
    private dispatcher: Dispatcher;
    private cache: Map<string, MatchedRoute | null> = new Map();

    constructor(container?: Container) {
        this.matcher = new RouteMatcher();
        this.dispatcher = new Dispatcher(container);
    }

    /**
     * Sync models from the static registry.
     */
    private syncModels(): void {
        const models = RouteRegistry.getInstance().getModels();
        for (const [key, resolver] of models.entries()) {
            this.dispatcher.bind(key, resolver);
        }
    }

    /**
     * Set the container for the dispatcher.
     */
    public setContainer(container: Container): this {
        this.dispatcher.setContainer(container);
        return this;
    }

    /**
     * Set the middleware groups.
     */
    public setMiddlewareGroups(groups: Record<string, any[]>): this {
        this.dispatcher.setMiddlewareGroups(groups);
        return this;
    }

    /**
     * Set the route middleware aliases.
     */
    public setRouteMiddleware(middleware: Record<string, any>): this {
        this.dispatcher.setRouteMiddleware(middleware);
        return this;
    }

    /**
     * Register a route model binding.
     */
    public model(key: string, resolver: ((value: any) => Promise<any>) | { findOrFail: (id: any) => Promise<any> }): this {
        this.dispatcher.bind(key, resolver);
        return this;
    }

    /**
     * Match a request to a route.
     */
    public match(method: string, path: string): MatchedRoute | null {
        const cacheKey = `${method.toUpperCase()}:${path}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const matched = this.matcher.match(method, path);
        this.cache.set(cacheKey, matched);

        return matched;
    }

    /**
     * Generate a URL for a named route.
     */
    public route(name: string, params: Record<string, string | number> = {}): string {
        const route = RouteRegistry.getInstance().getRouteByName(name);

        if (!route) {
            throw new Error(`Route [${name}] not found.`);
        }

        let path = route.path;

        for (const [key, value] of Object.entries(params)) {
            path = path.replace(`:${key}`, String(value)).replace(`{${key}}`, String(value));
        }

        // Return without checking for lingering parameters (that could be optional in regex)
        // just a basic replacement implementation.
        return path;
    }

    /**
     * Clear the route cache.
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Dispatch the request to the matching route and return the result.
     * Note: This does not wrap the result in a Response object.
     */
    public async dispatch(request: Request, response: Response): Promise<any> {
        this.syncModels();
        const matched = this.match(request.method(), request.path());

        if (!matched) {
            return null;
        }

        return await this.dispatcher.dispatch(matched, request, response);
    }
}
