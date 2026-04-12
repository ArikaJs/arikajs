import { Application } from '../../Contracts/Application';
import { Request, Response, HttpException } from '@arikajs/http';
import { MethodInvoker } from '@arikajs/dispatcher';
import * as crypto from 'node:crypto';
import * as path from 'node:path';

export class ActionDispatcher {
    private invoker: MethodInvoker;

    constructor(private app: Application) {
        this.invoker = new MethodInvoker(this.app.getContainer());
    }

    /**
     * Dispatch the server action.
     */
    public async dispatch(request: Request, response: Response): Promise<Response | null> {
        const action = request.input('_action');
        const sign = request.input('_action_sign');

        if (!action) return null;

        // 1. Verify Signature (Security)
        if (!this.verifySignature(action, sign)) {
            throw new HttpException(403, 'Invalid or missing action signature.');
        }

        // 2. Resolve Controller & Method
        const [controllerName, methodName] = action.split('@');
        if (!methodName) {
            throw new HttpException(400, 'Invalid action format. Expected Controller@method.');
        }

        // 3. Resolve Controller Class
        const controllerClass = await this.resolveController(controllerName);
        const controller = this.app.make(controllerClass);

        // 4. Execute using MethodInvoker (Handles DI and FormRequests)
        try {
            const result = await this.invoker.invoke(
                { controller, method: methodName },
                request,
                response,
                {}
            );

            // 5. Wrap result in JSON if it's not already a response
            const dispatcher = (this.app as any).make('dispatcher');
            return dispatcher.responseResolver.resolve(result, response);
        } catch (e: any) {
            // Handle Validation Errors specifically for AJAX Actions
            if (e.status === 422) {
                return response.status(422).json({
                    error: true,
                    message: e.message || 'Validation failed',
                    errors: e.errors || {}
                });
            }
            throw e;
        }
    }

    private verifySignature(action: string, sign: string): boolean {
        const key = this.app.config().get('app.key');
        if (!key) return false;

        const expected = crypto.createHmac('sha256', key as string)
            .update(action)
            .digest('hex');

        try {
            return crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(expected));
        } catch {
            return false;
        }
    }

    private async resolveController(name: string): Promise<any> {
        // 1. Check container first
        if (this.app.has(name)) {
            return this.app.make(name);
        }

        // 2. Attempt to dynamic load from app/Http/Controllers
        const root = this.app.getBasePath();
        const controllerPath = path.join(root, 'app', 'Http', 'Controllers', `${name}.ts`);
        const controllerPathJs = controllerPath.replace(/\.ts$/, '.js');

        try {
            const module = await import(controllerPath);
            return module[name] || module.default || Object.values(module)[0];
        } catch (e) {
            try {
                const module = await import(controllerPathJs);
                return module[name] || module.default || Object.values(module)[0];
            } catch (e2) {
                throw new HttpException(500, `Controller [${name}] could not be resolved.`);
            }
        }
    }
}
