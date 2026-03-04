export type RouteHandler = any;

export interface RouteDefinition {
    method: string;
    path: string;
    handler: RouteHandler;
    name?: string;
    prefix?: string;
    middleware: any[];
    regex?: RegExp;
    paramKeys?: string[];
    constraints?: Record<string, string>;
}

export interface MatchedRoute {
    route: RouteDefinition;
    params: Record<string, string>;
}

export interface Container {
    make<T>(token: any): T;
}
