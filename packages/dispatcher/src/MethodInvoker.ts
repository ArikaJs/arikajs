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
        params: any,
        route?: any
    ): Promise<any> {
        const paramValues = Array.isArray(params) ? params : (params ? Object.values(params) : []);

        let targetController = null;
        let targetMethod = handler as any;
        let methodKey = '';

        if (typeof handler === 'object' && 'controller' in handler) {
            targetController = handler.controller;
            targetMethod = targetController[handler.method];
            methodKey = handler.method;
        }

        // 1. Advanced DI via Container (if available)
        if (this.container && typeof this.container.call === 'function') {
            return this.container.call(handler, { request, response, ...params });
        }

        // 2. Intelligent Parameter Injection for Form Requests
        const args: any[] = [];
        let injectTypes: any[] = [];
        let formRequestClass = route?._formRequest;

        // Try to get metadata if reflecting is available (only works if controller has decorators)
        if (!formRequestClass && targetController && typeof Reflect !== 'undefined' && (Reflect as any).getMetadata) {
            injectTypes = (Reflect as any).getMetadata('design:paramtypes', targetController, methodKey) || [];
            formRequestClass = injectTypes[0];
        }

        // Detect if it's a FormRequest by checking for the validateForm method on the class prototype
        if (formRequestClass && formRequestClass.prototype && typeof formRequestClass.prototype.validateForm === 'function') {
            // Instantiate the Form Request
            const formRequest = new formRequestClass(request.getApplication(), request.getIncomingMessage());
            
            // Sync current request state to the new Form Request instance
            if (typeof formRequest.reset === 'function') formRequest.reset(request.getIncomingMessage());
            
            // Sync middleware-attached state (Crucial for Auth and Session)
            if (request.session) formRequest.session = request.session;
            if (request.auth) formRequest.auth = request.auth;
            if (request.view) formRequest.view = request.view;

            if (typeof formRequest.setBody === 'function') formRequest.setBody(request.body());
            if (typeof formRequest.setFiles === 'function') formRequest.setFiles(request.files());
            if (typeof formRequest.setParams === 'function') formRequest.setParams(request.params());
            
            // Link the route object if possible
            if (typeof (formRequest as any).setRoute === 'function') {
                (formRequest as any).setRoute(route);
            }

            // Run validation (This may throw a ValidationError handled by the Exception Handler)
            await formRequest.validateForm();
            
            args.push(formRequest);
        } else {
            // Fallback to base request
            args.push(request);
        }

        args.push(response);
        args.push(...paramValues);

        // 3. Final Execution
        if (targetController) {
            return targetMethod.apply(targetController, args);
        }

        return targetMethod(...args);
    }
}
