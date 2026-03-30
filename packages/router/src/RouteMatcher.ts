import { MatchedRoute } from './types';
import { RouteRegistry } from './RouteRegistry';

class RadixNode {
    children: Map<string, RadixNode> = new Map();
    paramNode: RadixNode | null = null;
    routes: any[] = []; // Support multiple methods on same path
}

export class RouteMatcher {
    private root: RadixNode = new RadixNode();
    private isBuilt = false;
    private staticPathMap: Map<string, any[]> = new Map();

    private buildTree() {
        const routes = RouteRegistry.getInstance().getRoutes();
        this.root = new RadixNode(); // Reset root
        this.staticPathMap.clear(); // Reset static map
        for (const route of routes) {
            this.insert(route);
        }
        this.isBuilt = true;
    }

    private insert(route: any) {
        // Fast-path: Literal O(1) lookup index
        const isStatic = route.path.indexOf(':') === -1 && route.path.indexOf('{') === -1;
        if (isStatic) {
            if (!this.staticPathMap.has(route.path)) {
                this.staticPathMap.set(route.path, []);
            }
            this.staticPathMap.get(route.path)!.push(route);
        }

        let node = this.root;
        const parts = route.path.split('/').filter(Boolean);

        for (const part of parts) {
            if (part.startsWith(':') || (part.startsWith('{') && part.endsWith('}'))) {
                if (!node.paramNode) {
                    node.paramNode = new RadixNode();
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

        const normalizedMethod = method.toUpperCase();

        // 1. Literal O(1) Fast-Path (The Fastify "Literal Jump")
        const staticRoutes = this.staticPathMap.get(path);
        if (staticRoutes) {
            for (let i = 0; i < staticRoutes.length; i++) {
                const route = staticRoutes[i];
                if (route.method === normalizedMethod || route.method === 'ANY') {
                    return { route, params: {}, hasParams: false };
                }
            }
        }

        // 2. Pointer-Based Scanner (The Fastify "Radix Scan")
        let node = this.root;
        const collectedValues: string[] = [];
        const len = path.length;
        let start = 1; // Skip the leading slash

        if (len > 1) {
            while (start < len) {
                let end = start;
                while (end < len && path[end] !== '/') end++;
                
                const part = path.substring(start, end);
                const nextNode = node.children.get(part);
                
                if (nextNode) {
                    node = nextNode;
                } else if (node.paramNode) {
                    collectedValues.push(part);
                    node = node.paramNode;
                } else {
                    return null; // Branch exhausted
                }

                start = end + 1;
            }
        }

        if (node.routes.length > 0) {
            const route = node.routes.find(r => r.method === normalizedMethod || r.method === 'ANY');
            if (route) {
                const hasParams = collectedValues.length > 0;
                
                // Lazy-params: We avoid building the object here. 
                // The Dispatcher will build it only if required.
                return { 
                    route, 
                    params: collectedValues as any, // Temporary array-based params
                    hasParams 
                };
            }
        }

        return null;
    }
}
