
import { Log } from '@arikajs/logging';

export class RequestLoggingMiddleware {
    public async handle(request: any, next: (request: any) => Promise<any>): Promise<any> {
        const start = Date.now();
        const method = request.method();
        const url = request.path();

        const response = await next(request);

        const duration = Date.now() - start;
        Log.info(`${method} ${url} - ${duration}ms`);

        return response;
    }
}
