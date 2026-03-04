import { RouteRegistry } from './RouteRegistry';
import { RouteHandler } from './types';
import { RouteEntry } from './RouteEntry';

export class RouteGroupBuilder {
    private options: { prefix?: string; middleware?: any[] } = {};

    public prefix(prefix: string): this {
        this.options.prefix = prefix;
        return this;
    }

    public middleware(middleware: any | any[]): this {
        this.options.middleware = Array.isArray(middleware) ? middleware : [middleware];
        return this;
    }

    public group(callback: () => void): void {
        RouteRegistry.getInstance().group(this.options, callback);
    }
}

export class Route {
    public static get(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('GET', path, handler);
    }

    public static post(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('POST', path, handler);
    }

    public static put(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('PUT', path, handler);
    }

    public static patch(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('PATCH', path, handler);
    }

    public static delete(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('DELETE', path, handler);
    }

    public static any(path: string, handler: RouteHandler): RouteEntry[] {
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
        return methods.map(method => RouteRegistry.getInstance().addRoute(method, path, handler));
    }

    public static options(path: string, handler: RouteHandler): RouteEntry {
        return RouteRegistry.getInstance().addRoute('OPTIONS', path, handler);
    }

    public static match(methods: string[], path: string, handler: RouteHandler): RouteEntry[] {
        return methods.map(method => RouteRegistry.getInstance().addRoute(method.toUpperCase(), path, handler));
    }

    public static redirect(path: string, destination: string, status = 302): RouteEntry {
        return RouteRegistry.getInstance().addRoute('ANY', path, (request: any, response: any) => {
            if (response && typeof response.redirect === 'function') {
                return response.redirect(destination, status);
            }
            return { $status: status, $redirect: destination }; // Fallback signaling for dispatcher
        });
    }

    public static resource(name: string, controller: any): void {
        Route.get(`/${name}`, [controller, 'index']).as(`${name}.index`);
        Route.get(`/${name}/create`, [controller, 'create']).as(`${name}.create`);
        Route.post(`/${name}`, [controller, 'store']).as(`${name}.store`);
        Route.get(`/${name}/:id`, [controller, 'show']).as(`${name}.show`);
        Route.get(`/${name}/:id/edit`, [controller, 'edit']).as(`${name}.edit`);
        Route.put(`/${name}/:id`, [controller, 'update']).as(`${name}.update`);
        Route.patch(`/${name}/:id`, [controller, 'update']).as(`${name}.update`);
        Route.delete(`/${name}/:id`, [controller, 'destroy']).as(`${name}.destroy`);
    }

    public static group(options: string | { prefix?: string; middleware?: any | any[] }, callback: () => void): void {
        RouteRegistry.getInstance().group(options, callback);
    }

    public static prefix(prefix: string): RouteGroupBuilder {
        return new RouteGroupBuilder().prefix(prefix);
    }

    public static middleware(middleware: any | any[]): RouteGroupBuilder {
        return new RouteGroupBuilder().middleware(middleware);
    }

    public static model(key: string, resolver: any): void {
        RouteRegistry.getInstance().model(key, resolver);
    }
}
