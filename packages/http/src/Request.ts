import { Application } from './Contracts/Application';
import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import * as cookie from 'cookie';

export class Request {
    private readonly app: Application;
    private readonly req: IncomingMessage;
    private readonly searchParams: URLSearchParams;
    private _cookies: Record<string, string | undefined> | null = null;
    private _body: any = null;
    private _params: Record<string, string> = {};
    public session: any;

    constructor(app: Application, req: IncomingMessage) {
        this.app = app;
        this.req = req;

        const fullUrl = `${this.baseUrl()}${req.url || '/'}`;
        this.searchParams = new URL(fullUrl).searchParams;

        // Initialize a lightweight in-memory session store (fallback until full session middleware)
        const store: Record<string, any> = {};
        this.session = {
            get(key: string) { return store[key] ?? null; },
            put(key: string, value: any) { store[key] = value; },
            forget(key: string) { delete store[key]; },
            has(key: string) { return key in store; },
            all() { return { ...store }; },
        };
    }

    /**
     * Get the base URL (scheme + host) of the request.
     * Falls back to app.url config if host header is missing.
     */
    baseUrl(): string {
        const trustProxy = this.app.config().get('http.trustProxy', false);
        const protocol = trustProxy ? (this.header('x-forwarded-proto') as string || 'http') : 'http';
        const host = trustProxy ? (this.header('x-forwarded-host') as string || this.req.headers.host) : this.req.headers.host;

        if (host) {
            return `${protocol}://${host}`;
        }

        return this.app.config().get('app.url', 'http://localhost') as string;
    }

    /**
     * Get the application instance.
     */
    getApplication(): Application {
        return this.app;
    }

    /**
     * Get the underlying Node request.
     */
    getRaw(): IncomingMessage {
        return this.req;
    }

    /**
     * Get the HTTP method.
     */
    method(): string {
        return this.req.method || 'GET';
    }

    /**
     * Get the request path.
     */
    path(): string {
        const url = new URL(this.req.url || '/', `http://${this.req.headers.host || 'localhost'}`);
        return url.pathname;
    }

    /**
     * Get all headers.
     */
    headers(): Record<string, string | string[] | undefined> {
        return this.req.headers;
    }

    /**
     * Get a specific header.
     */
    header(name: string): string | string[] | undefined {
        return this.req.headers[name.toLowerCase()];
    }

    /**
     * Get all cookies.
     */
    cookies(): Record<string, string | undefined> {
        if (this._cookies === null) {
            const cookieHeader = this.header('cookie');
            this._cookies = typeof cookieHeader === 'string' ? cookie.parse(cookieHeader) : {};
        }
        return this._cookies;
    }

    /**
     * Get a specific cookie.
     */
    cookie(name: string): string | undefined {
        return this.cookies()[name];
    }

    /**
     * Get a query parameter.
     */
    query(key: string): string | null {
        return this.searchParams.get(key);
    }

    /**
     * Set the route parameters.
     */
    setParams(params: Record<string, string>): void {
        this._params = params;
    }

    /**
     * Get all route parameters.
     */
    params(): Record<string, string> {
        return this._params;
    }

    /**
     * Get a specific route parameter.
     */
    param(key: string, defaultValue: string | null = null): string | null {
        return this._params[key] ?? defaultValue;
    }

    /**
     * Set the parsed body (usually set by middleware).
     */
    setBody(body: any): void {
        this._body = body;
    }

    /**
     * Get an input value from route params, body, or query.
     */
    input(key: string, defaultValue: any = null): any {
        // 1. Check route parameters
        if (this._params[key] !== undefined) {
            return this._params[key];
        }

        // 2. Check body
        if (this._body && typeof this._body === 'object' && key in this._body) {
            return this._body[key];
        }

        // 3. Check query string
        return this.query(key) ?? defaultValue;
    }

    /**
     * Get the parsed body.
     */
    body(): any {
        return this._body;
    }

    /**
     * Get all input (query + body).
     */
    all(): any {
        const query = Object.fromEntries(this.searchParams.entries());
        const body = typeof this._body === 'object' && this._body !== null ? this._body : {};
        return { ...query, ...body };
    }

    /**
     * Get a subset of the input data.
     */
    only(keys: string[]): Record<string, any> {
        const all = this.all();
        const result: Record<string, any> = {};

        keys.forEach(key => {
            if (key in all) {
                result[key] = all[key];
            }
        });

        return result;
    }

    /**
     * Get all input data except for a specified array of keys.
     */
    except(keys: string[]): Record<string, any> {
        const all = this.all();
        const result: Record<string, any> = { ...all };

        keys.forEach(key => {
            delete result[key];
        });

        return result;
    }

    /**
     * Get the original incoming message.
     */
    getIncomingMessage(): IncomingMessage {
        return this.req;
    }
}
