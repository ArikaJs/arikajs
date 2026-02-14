
import { Request, Response, HttpException } from '@arikajs/http';
import { Log } from '@arikajs/logging';

export class Handler {
    /**
     * A list of the exception types that should not be reported.
     */
    protected dontReport: any[] = [];

    /**
     * Custom renderers for specific exception types.
     */
    protected renderers: Map<any, (request: Request, error: any, response: Response) => Response> = new Map();

    /**
     * Report or log an exception.
     */
    public report(error: any): void {
        if (this.shouldReport(error)) {
            Log.error(error.message || 'Error', {
                stack: error.stack,
                name: error.name || 'Error',
                originalError: error.originalError
            });
        }
    }

    /**
     * Render an exception into an HTTP response.
     */
    public render(request: Request, error: any, response: Response): Response {
        // 1. Check if the error has a custom renderer
        for (const [type, renderer] of this.renderers.entries()) {
            if (error instanceof type) {
                return renderer(request, error, response);
            }
        }

        // 2. Check if the error is "renderable" (has a render method)
        if (typeof error.render === 'function') {
            return error.render(request, response);
        }

        // 3. Handle HttpException specifically
        if (error instanceof HttpException) {
            return response.status(error.getStatusCode()).json({
                error: true,
                message: error.message,
                ...(this.shouldDisplayStackTrace() ? { trace: error.stack } : {})
            });
        }

        // 4. Default error handling
        const status = error.statusCode || error.status || 500;
        const message = status === 500 && !this.shouldDisplayStackTrace()
            ? 'Internal Server Error'
            : error.message || 'Unknown Error';

        return response.status(status).json({
            error: true,
            message: message,
            ...(this.shouldDisplayStackTrace() ? {
                name: error.name,
                trace: error.stack
            } : {})
        });
    }

    /**
     * Determine if the exception should be reported.
     */
    protected shouldReport(error: any): boolean {
        return !this.dontReport.some(type => error instanceof type);
    }

    /**
     * Determine if the stack trace should be displayed.
     */
    protected shouldDisplayStackTrace(): boolean {
        return process.env.NODE_ENV === 'development' || process.env.APP_DEBUG === 'true';
    }

    /**
     * Register a custom renderer for an exception type.
     */
    public renderable(type: any, renderer: (request: Request, error: any, response: Response) => Response): this {
        this.renderers.set(type, renderer);
        return this;
    }

    /**
     * Add an exception type to the dontReport list.
     */
    public ignore(type: any): this {
        if (!this.dontReport.includes(type)) {
            this.dontReport.push(type);
        }
        return this;
    }
}
