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
        if (this.shouldDisplayStackTrace()) {
            return response.status(status).send(await this.renderStackTrace(error, status));
        }

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

        return response.status(status).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${status} - ${error.message || 'An error occurred'}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
                    .container { max-width: 28rem; padding: 2.5rem; }
                    h1 { font-size: 6rem; font-weight: 800; color: #8b5cf6; margin: 0; line-height: 1; }
                    p { font-size: 1.25rem; color: #64748b; margin: 1.5rem 0 2rem; }
                    .btn { display: inline-block; background: #8b5cf6; color: white; padding: 0.75rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600; transition: background 0.2s; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3); }
                    .btn:hover { background: #7c3aed; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${status}</h1>
                    <p>${error.message || 'Something went wrong on our end.'}</p>
                    <a href="/" class="btn">Return Home</a>
                </div>
            </body>
            </html>
        `);
    }

    /**
     * Render a pretty stack trace for development mode.
     */
    protected async renderStackTrace(error: any, status: number): Promise<string> {
        const message = error.message || 'An error occurred';
        const name = error.name || 'Error';
        const rawStack = error.stack || '';

        // Process stack tracks into structured data
        const frames = rawStack.split('\n')
            .filter((line: string) => line.includes('at '))
            .map((line: string) => {
                // Regex to extract Method, File, Line, Column
                const match = line.match(/at (?:(.+)\s+\()?(?:(.+):(\d+):(\d+))\)?/);
                if (match) {
                    const file = match[2];
                    const isApp = file.includes('/app/') || (!file.includes('node_modules') && !file.includes('packages/'));
                    
                    return {
                        method: (match[1] || 'anonymous').replace('async ', ''),
                        file: file,
                        line: parseInt(match[3]),
                        column: parseInt(match[4]),
                        isApp: isApp,
                        shortFile: file.split('/').slice(-3).join('/')
                    };
                }
                return { raw: line.trim(), isApp: false };
            });

        // 🔍 Attempt to get code snippet for the first application frame (or first frame)
        let codeSnippet = '';
        let snippetFile = '';
        let snippetLine = 0;

        const mainFrame = frames.find((f: any) => f.isApp) || frames[0];
        
        if (mainFrame && mainFrame.file && mainFrame.file.startsWith('/') && !mainFrame.raw) {
            try {
                const fs = await import('fs');
                const content = await fs.promises.readFile(mainFrame.file, 'utf8');
                const lines = content.split('\n');
                const start = Math.max(0, mainFrame.line - 6);
                const end = Math.min(lines.length, mainFrame.line + 4);
                
                snippetFile = mainFrame.file;
                snippetLine = mainFrame.line;

                codeSnippet = lines.slice(start, end).map((code, index) => {
                    const currentLine = start + index + 1;
                    const isErrorLine = currentLine === mainFrame.line;
                    
                    // Basic syntax highlighting for the preview
                    let highlighted = code
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/(static|public|protected|private|async|await|class|interface|export|import|from|const|let|var|return|if|else|for|while|await|async|try|catch|new|this|throw|new)/g, '<span style="color:#0ea5e9">$1</span>')
                        .replace(/('[^']*')/g, '<span style="color:#d946ef">$1</span>')
                        .replace(/("[^"]*")/g, '<span style="color:#d946ef">$1</span>')
                        .replace(/(`[^`]*`)/g, '<span style="color:#d946ef">$1</span>')
                        .replace(/(\/\/.+)/g, '<span style="color:#94a3b8">$1</span>');

                    return `
                        <div style="display:flex; background:${isErrorLine ? '#fef2f2' : 'transparent'}; border-left: 3px solid ${isErrorLine ? '#ef4444' : 'transparent'}">
                            <span style="width:40px; text-align:right; padding-right:15px; color:#94a3b8; user-select:none; font-size:12px;">${currentLine}</span>
                            <pre style="margin:0; font-family:'JetBrains Mono', monospace; font-size:13px; color:${isErrorLine ? '#b91c1c' : '#475569'}">${highlighted || ' '}</pre>
                        </div>
                    `;
                }).join('');
            } catch (e) {
                // Silently fail if file can't be read
            }
        }

        // Adjust heading size for long messages
        const headingSize = message.length > 100 ? '1.5rem' : '2.5rem';

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${name}: ${message}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg: #f8fafc;
                    --surface: #ffffff;
                    --primary: #0ea5e9;
                    --primary-dark: #0369a1;
                    --text: #0f172a;
                    --text-muted: #64748b;
                    --border: #e2e8f0;
                    --danger: #ef4444;
                }

                * { box-sizing: border-box; }
                body { 
                    font-family: 'Outfit', sans-serif; 
                    background: var(--bg); 
                    color: var(--text); 
                    margin: 0; 
                    line-height: 1.6;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                header {
                    padding: 5rem 2rem 4rem;
                    background: white;
                    border-bottom: 1px solid var(--border);
                    text-align: left;
                }

                .container { max-width: 1200px; margin: 0 auto; width: 100%; }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: #fee2e2;
                    color: #ef4444;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 1rem;
                }

                h1 {
                    font-size: ${headingSize};
                    margin: 0;
                    font-weight: 700;
                    color: var(--text);
                    line-height: 1.3;
                    word-break: break-all;
                    overflow-wrap: anywhere;
                }

                .subtitle {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }

                main {
                    padding: 3rem 2rem;
                    flex-grow: 1;
                }

                .card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    margin-bottom: 2rem;
                }

                .card-header {
                    padding: 1rem 1.5rem;
                    background: #f8fafc;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .card-title {
                    font-weight: 700;
                    color: #475569;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .snippet-container {
                    padding: 1.5rem 0;
                    background: #ffffff;
                }

                .snippet-meta {
                    padding: 0 1.5rem 1rem;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-family: 'JetBrains Mono', monospace;
                }

                .snippet-meta strong { color: var(--text); }

                .frames { background: white; }

                .frame {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border);
                    transition: all 0.1s;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    cursor: pointer;
                }

                .frame.is-app {
                    border-left: 3px solid var(--primary);
                }

                .frame:last-child { border-bottom: none; }

                .frame:hover { background: #f1f5f966; }

                .frame-method {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 600;
                    color: var(--text);
                    font-size: 0.9rem;
                }

                .frame-is-app-tag {
                    font-size: 0.6rem;
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                    text-transform: uppercase;
                    font-weight: 700;
                    margin-left: 0.5rem;
                    vertical-align: middle;
                }

                .frame-location {
                    color: var(--text-muted);
                    font-size: 0.8rem;
                }

                .frame-file { color: #64748b; }
                .frame-line { color: var(--danger); font-weight: 600; }

                .frame-full-path {
                    font-size: 0.7rem;
                    color: #cbd5e1;
                    margin-top: 2px;
                    word-break: break-all;
                }

                footer {
                    padding: 3rem;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .arikajs-link {
                    color: var(--primary);
                    font-weight: 700;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <header>
                <div class="container">
                    <span class="status-badge">${name}</span>
                    <h1>${message.replace(/(\/.+?\/)/g, '<span style="color:#64748b; font-weight:400">$1</span>')}</h1>
                    <div class="subtitle">ArikaJS Exception Handler • HTTP ${status}</div>
                </div>
            </header>

            <main>
                <div class="container">
                    ${codeSnippet ? `
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Code Preview</span>
                        </div>
                        <div class="snippet-container">
                            <div class="snippet-meta">
                                <strong>${snippetFile}</strong> : ${snippetLine}
                            </div>
                            ${codeSnippet}
                        </div>
                    </div>
                    ` : ''}

                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Stack Trace</span>
                        </div>
                        <div class="frames">
                            ${frames.map((frame: any) => {
                                if (frame.raw) {
                                    return `<div class="frame"><div class="frame-location" style="opacity:0.5">${frame.raw}</div></div>`;
                                }
                                return `
                                <div class="frame ${frame.isApp ? 'is-app' : ''}">
                                    <div>
                                        <span class="frame-method">${frame.method}</span>
                                        ${frame.isApp ? '<span class="frame-is-app-tag">Application</span>' : ''}
                                    </div>
                                    <div class="frame-location">
                                        in <span class="frame-file">${frame.shortFile}</span> 
                                        at line <span class="frame-line">${frame.line}</span>
                                    </div>
                                    <div class="frame-full-path">${frame.file}</div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <div class="container">
                    <p>Debugging enabled. Powered by <a href="#" class="arikajs-link">ArikaJS</a> Exception Handler.</p>
                </div>
            </footer>
        </body>
        </html>
        `;
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
