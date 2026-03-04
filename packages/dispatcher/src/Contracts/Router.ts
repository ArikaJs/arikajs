
export interface MatchedRoute {
    route: {
        handler: any;
        middleware?: any[];
        [key: string]: any;
    };
    params: Record<string, string>;
}
