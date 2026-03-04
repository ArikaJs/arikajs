import { RouteHandler } from './types';
import { RouteEntry } from './RouteEntry';

export class RouteRegistry {
    private static instance: RouteRegistry;
    private routes: RouteEntry[] = [];
    private groupStack: string[] = [];
    private middlewareStack: any[][] = [];
    private models: Map<string, any> = new Map();

    private constructor() { }

    public static getInstance(): RouteRegistry {
        if (!RouteRegistry.instance) {
            RouteRegistry.instance = new RouteRegistry();
        }
        return RouteRegistry.instance;
    }

    public model(key: string, resolver: any): void {
        this.models.set(key, resolver);
    }

    public getModels(): Map<string, any> {
        return this.models;
    }

    public addRoute(method: string, path: string, handler: RouteHandler): RouteEntry {
        const prefix = this.groupStack.join('');
        const fullPath = this.normalizePath(prefix + '/' + path);
        const groupMiddleware = this.middlewareStack.flat();

        const route = new RouteEntry(
            method,
            fullPath,
            handler,
            prefix || undefined,
            groupMiddleware
        );

        this.routes.push(route);
        return route;
    }

    public group(options: string | { prefix?: string; middleware?: any | any[] }, callback: () => void): void {
        let prefix = typeof options === 'string' ? options : options.prefix || '';

        if (prefix && !prefix.startsWith('/')) {
            prefix = '/' + prefix;
        }

        const middleware = typeof options === 'string' ? [] : (Array.isArray(options.middleware) ? options.middleware : (options.middleware ? [options.middleware] : []));

        this.groupStack.push(prefix);
        this.middlewareStack.push(middleware);

        callback();

        this.middlewareStack.pop();
        this.groupStack.pop();
    }

    public getRoutes(): RouteEntry[] {
        return this.routes;
    }

    public getRouteByName(name: string): RouteEntry | undefined {
        return this.routes.find(r => r.name === name);
    }

    public clear(): void {
        this.routes = [];
        this.groupStack = [];
        this.middlewareStack = [];
    }

    private normalizePath(path: string): string {
        const normalized = path.replace(/\/+/g, '/');
        return normalized.startsWith('/') ? normalized : '/' + normalized;
    }
}
