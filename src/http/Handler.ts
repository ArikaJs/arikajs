
import { Request, Response } from '@arikajs/http';
import { Log } from '@arikajs/logging';

export class Handler {
    /**
     * Report or log an exception.
     */
    public report(error: Error): void {
        Log.error(error.message, { stack: error.stack });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public render(request: Request, error: any, response: Response): Response {
        // Handle specific error types if needed
        const status = error.status || 500;
        const message = status === 500 ? 'Internal Server Error' : error.message;

        return response.status(status).json({
            error: true,
            message: message,
            ...(this.shouldDisplayStackTrace() ? { trace: error.stack } : {})
        });
    }

    /**
     * Determine if the stack trace should be displayed.
     */
    protected shouldDisplayStackTrace(): boolean {
        return process.env.NODE_ENV === 'development' || process.env.APP_DEBUG === 'true';
    }
}
