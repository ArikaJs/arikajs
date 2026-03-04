import { ServerResponse } from 'node:http';
import * as cookie from 'cookie';

export class Response {
    private readonly res: ServerResponse;
    private _status: number = 200;
    private _headers: Record<string, string | number | string[]> = {};
    private _cookies: string[] = [];
    private _content: string | Buffer | null = null;

    constructor(res: ServerResponse) {
        this.res = res;
    }

    /**
     * Set the HTTP status code.
     */
    status(code: number): this {
        this._status = code;
        return this;
    }

    /**
     * Helper: 200 OK.
     */
    ok(): this {
        return this.status(200);
    }

    /**
     * Helper: 201 Created.
     */
    created(): this {
        return this.status(201);
    }

    /**
     * Helper: 204 No Content.
     */
    noContent(): this {
        return this.status(204);
    }

    /**
     * Helper: 403 Forbidden.
     */
    forbidden(): this {
        return this.status(403);
    }

    /**
     * Helper: 404 Not Found.
     */
    notFound(): this {
        return this.status(404);
    }

    /**
     * Set a header.
     */
    header(name: string, value: string | number | string[]): this {
        this._headers[name] = value;
        return this;
    }

    /**
     * Set a cookie.
     */
    cookie(name: string, value: string, options: cookie.SerializeOptions = {}): this {
        this._cookies.push(cookie.serialize(name, value, {
            path: '/',
            ...options
        }));
        return this;
    }

    /**
     * Set the response content as JSON.
     */
    json(data: any, status?: number): this {
        if (status) {
            this.status(status);
        }
        this._content = JSON.stringify(data);
        this.header('Content-Type', 'application/json');
        return this;
    }

    /**
     * Set the response content as plain text or HTML.
     */
    public send(content: string | Buffer, status?: number): this {
        if (status) {
            this.status(status);
        }
        this._content = content;
        if (typeof content === 'string' && !this._headers['Content-Type']) {
            this.header('Content-Type', content.startsWith('<') ? 'text/html' : 'text/plain');
        }
        return this;
    }

    /**
     * Redirect to a specific URL.
     */
    public redirect(url: string, status: number = 302): this {
        this.status(status);
        this.header('Location', url);
        this._content = `Redirecting to ${url}`;
        return this;
    }

    /**
     * Set the response content.
     */
    setContent(content: string | Buffer): this {
        this._content = content;
        return this;
    }

    /**
     * Get the current content.
     */
    getContent(): string | Buffer | null {
        return this._content;
    }

    /**
     * Get the current status code.
     */
    getStatusCode(): number {
        return this._status;
    }

    /**
     * Get all currently set headers.
     */
    getHeaders(): Record<string, string | number | string[]> {
        return this._headers;
    }

    /**
     * Actually terminate the request and send to client.
     * This is called by the Kernel.
     */
    terminate(): void {
        if (this.res.writableEnded) {
            return;
        }

        // 1. Set Status
        this.res.statusCode = this._status;

        // 2. Set Headers
        for (const [name, value] of Object.entries(this._headers)) {
            this.res.setHeader(name, value);
        }

        // 3. Set Cookies
        if (this._cookies.length > 0) {
            this.res.setHeader('Set-Cookie', this._cookies);
        }

        // 4. Send body and end
        this.res.end(this._content ?? '');
    }

    /**
     * Get the underlying Node response.
     */
    getOriginalResponse(): ServerResponse {
        return this.res;
    }
}
