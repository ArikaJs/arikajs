
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
    public async render(request: Request, error: any, response: Response): Promise<Response> {
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
            const status = error.getStatusCode();
            const isBrowserRequest = this.isBrowserRequest(request);

            if (isBrowserRequest) {
                return this.renderForBrowser(request, status, error, response);
            }

            return response.status(status).json({
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

        const isBrowserRequest = this.isBrowserRequest(request);
        if (isBrowserRequest) {
            return this.renderForBrowser(request, status, error, response);
        }

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
     * Determine if the incoming request is a browser (non-API, non-JSON) request.
     */
    protected isBrowserRequest(request: Request): boolean {
        if (!request || typeof request.path !== 'function') return false;
        if (request.path().startsWith('/api')) return false;
        const accept = (request.header('accept') as string) || '';
        if (accept.includes('application/json') && !accept.includes('text/html')) return false;
        return true;
    }

    /**
     * Render an error response for browser (HTML) clients.
     * Override in the application Handler to show custom error views.
     */
    protected async renderForBrowser(request: Request, status: number, error: any, response: Response): Promise<Response> {
        const supportedErrors = [401, 403, 404, 419, 429, 500, 503];

        if (supportedErrors.includes(status)) {
            const fs = await import('fs');
            const path = await import('path');
            const appName = process.env.APP_NAME || 'ArikaJS';

            const renderFile = async (filePath: string): Promise<string | null> => {
                try {
                    let html = await fs.promises.readFile(filePath, 'utf8');
                    html = html.replace(/\{\{app_name\}\}/g, appName);
                    // Also replace ArkJS template config() calls
                    html = html.replace(/\{\{\s*config\('app\.name'[^)]*\)\s*\}\}/g, appName);
                    return html;
                } catch { return null; }
            };

            // 1. App override: resources/views/errors/{status}.ark.html
            const root = process.env.PROJECT_ROOT || process.cwd();
            const appView = path.join(root, 'resources', 'views', 'errors', `${status}.ark.html`);
            const appHtml = await renderFile(appView);
            if (appHtml) return response.status(status).send(appHtml);

            // 2. Framework bundled views (packages/arikajs/src/http/views/errors/)
            const frameworkView = path.join(__dirname, 'views', 'errors', `${status}.ark.html`);
            const frameworkHtml = await renderFile(frameworkView);
            if (frameworkHtml) return response.status(status).send(frameworkHtml);

            // 3. Also try dist path (when running from compiled JS)
            const frameworkViewDist = path.join(__dirname, '..', '..', 'src', 'http', 'views', 'errors', `${status}.ark.html`);
            const frameworkHtmlDist = await renderFile(frameworkViewDist);
            if (frameworkHtmlDist) return response.status(status).send(frameworkHtmlDist);
        }

        return response.status(status).send(
            `<!DOCTYPE html><html><head><title>${status} Error</title></head><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1 style="font-size:4rem;color:#8b5cf6">${status}</h1><p style="color:#64748b">${error.message || 'An error occurred'}</p><a href="/" style="color:#8b5cf6">Return Home</a></body></html>`
        );
    }


    /**
     * Set the exceptions that should not be reported.
     */
    public dontReportExceptions(exceptions: any[]): this {
        this.dontReport = [...this.dontReport, ...exceptions];
        return this;
    }

    /**
     * Map an exception to a custom renderer.
     */
    public map(type: any, renderer: (request: Request, error: any, response: Response) => Response): this {
        this.renderers.set(type, renderer);
        return this;
    }

    /**
     * Register a custom renderer for an exception type.
     */
    public renderable(type: any, renderer: (request: Request, error: any, response: Response) => Response): this {
        return this.map(type, renderer);
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
