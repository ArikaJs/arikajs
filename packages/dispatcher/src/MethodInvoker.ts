import { Request, Response } from './Contracts/Http';

export class MethodInvoker {
    constructor(private container?: any) { }

    public setContainer(container: any): this {
        this.container = container;
        return this;
    }

    /**
     * Invoke the handler (closure or controller method) with injected parameters.
     */
    public invoke(
        handler: Function | { controller: any; method: string },
        request: Request,
        response: Response,
        params: any
    ): Promise<any> | any {
        const paramValues = Array.isArray(params) ? params : (params ? Object.values(params) : []);

        // Fast-path: Skip container overhead for simple handlers
        if (typeof handler === 'function') {
            if (handler.length <= 3 && !(handler as any).inject) {
                return (handler as any)(request, response, ...paramValues);
            }
        }

        // Advanced DI via Container
        if (this.container && typeof this.container.call === 'function') {
            return this.container.call(handler, { request, response, ...params });
        }

        if (typeof handler === 'function') {
            return (handler as any)(request, response, ...paramValues);
        }

        const { controller, method } = (handler as any);
        return controller[method](request, response, ...paramValues);
    }
}
