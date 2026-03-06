import { MatchedRoute } from './types';
import { RouteRegistry } from './RouteRegistry';

class RadixNode {
    children: Map<string, RadixNode> = new Map();
    paramName: string | null = null;
    paramNode: RadixNode | null = null;
    routes: any[] = []; // Support multiple methods on same path
}

export class RouteMatcher {
    private root: RadixNode = new RadixNode();
    private isBuilt = false;

    private buildTree() {
        const routes = RouteRegistry.getInstance().getRoutes();
        this.root = new RadixNode(); // Reset root
        for (const route of routes) {
            this.insert(route);
        }
        this.isBuilt = true;
    }

    private insert(route: any) {
        let node = this.root;
        const parts = route.path.split('/').filter(Boolean);

        for (const part of parts) {
            if (part.startsWith(':')) {
                const paramName = part.slice(1);
                if (!node.paramNode) {
                    node.paramNode = new RadixNode();
                    node.paramName = paramName;
                }
                node = node.paramNode;
            } else {
                if (!node.children.has(part)) {
                    node.children.set(part, new RadixNode());
                }
                node = node.children.get(part)!;
            }
        }
        node.routes.push(route);
    }

    public match(method: string, path: string): MatchedRoute | null {
        if (!this.isBuilt) this.buildTree();

        let node = this.root;
        const normalizedPath = path.split('?')[0];
        const parts = normalizedPath.split('/').filter(Boolean);
        const params: Record<string, string> = {};
        const normalizedMethod = method.toUpperCase();

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const nextNode = node.children.get(part);
            if (nextNode) {
                node = nextNode;
            } else if (node.paramNode) {
                if (node.paramName) {
                    params[node.paramName] = part;
                }
                node = node.paramNode;
            } else {
                return null;
            }
        }

        if (node.routes.length > 0) {
            // Find a route that matches the method OR has method 'ANY'
            const route = node.routes.find(r => r.method === normalizedMethod || r.method === 'ANY');
            if (route) {
                const hasParams = Object.keys(params).length > 0;
                // If there are constraints, verify them
                if (route.constraints && Object.keys(route.constraints).length > 0) {
                    for (const [key, pattern] of Object.entries(route.constraints)) {
                        if (params[key]) {
                            const regex = new RegExp(`^${pattern}$`);
                            if (!regex.test(params[key])) {
                                return null;
                            }
                        }
                    }
                }
                return { route, params, hasParams };
            }
        }

        return null;
    }
}
