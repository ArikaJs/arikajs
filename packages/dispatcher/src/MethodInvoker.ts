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
    public async invoke(
        handler: Function | { controller: any; method: string },
        request: Request,
        response: Response,
        params: Record<string, any>
    ): Promise<any> {
        // Advanced DI via Container
        if (this.container && typeof this.container.call === 'function') {
            return await this.container.call(handler, { request, response, ...params });
        }

        if (typeof handler === 'function') {
            return await handler(request, response, ...Object.values(params));
        }

        const { controller, method } = handler;
        return await controller[method](request, response, ...Object.values(params));
    }
}
