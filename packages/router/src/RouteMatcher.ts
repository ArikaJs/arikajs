import { MatchedRoute } from './types';
import { RouteRegistry } from './RouteRegistry';

class RadixNode {
    children: Map<string, RadixNode> = new Map();
    paramName: string | null = null;
    paramNode: RadixNode | null = null;
    route: any = null;
}

export class RouteMatcher {
    private root: RadixNode = new RadixNode();
    private isBuilt = false;

    private buildTree() {
        const routes = RouteRegistry.getInstance().getRoutes();
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
        node.route = route;
    }

    public match(method: string, path: string): MatchedRoute | null {
        if (!this.isBuilt) this.buildTree();

        let node = this.root;
        const normalizedPath = path.split('?')[0];
        const parts = normalizedPath.split('/').filter(Boolean);
        const params: Record<string, string> = {};
        const normalizedMethod = method.toUpperCase();

        for (const part of parts) {
            const nextNode = node.children.get(part);
            if (nextNode) {
                node = nextNode;
            } else if (node.paramNode) {
                params[node.paramName!] = part;
                node = node.paramNode;
            } else {
                return null;
            }
        }

        if (node.route && node.route.method === normalizedMethod) {
            return { route: node.route, params };
        }

        return null;
    }
}
