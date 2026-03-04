import { MatchedRoute } from './types';
import { RouteRegistry } from './RouteRegistry';

export class RouteMatcher {
    public match(method: string, path: string): MatchedRoute | null {
        const routes = RouteRegistry.getInstance().getRoutes();
        const normalizedMethod = method.toUpperCase();
        const normalizedPath = this.normalizePath(path);

        for (const route of routes) {
            if (route.method !== normalizedMethod) {
                continue;
            }

            const match = normalizedPath.match(route.regex);
            if (match) {
                const params: Record<string, string> = {};
                route.paramKeys.forEach((key, index) => {
                    params[key] = match[index + 1];
                });

                return {
                    route,
                    params
                };
            }
        }

        return null;
    }

    private normalizePath(path: string): string {
        return path.replace(/\/+/g, '/') || '/';
    }
}
