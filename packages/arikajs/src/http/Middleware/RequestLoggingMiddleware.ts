
import { Log } from '@arikajs/logging';

export class RequestLoggingMiddleware {
    public handle(request: any, next: (request: any) => Promise<any> | any): Promise<any> | any {
        // Benchmarking Fast-path: Skip logging if silent mode is enabled
        if (process.env.ARIKA_SILENT === 'true') {
            return next(request);
        }

        const start = Date.now();
        const res = next(request);

        if (res instanceof Promise) {
            return res.then(response => {
                this.log(request, response, start);
                return response;
            });
        }

        this.log(request, res, start);
        return res;
    }

    private log(request: any, response: any, start: number) {
        const duration = Date.now() - start;
        Log.info(`${request.method()} ${request.path()} - ${duration}ms`);
    }
}
