import { Application } from './Contracts/Application';
import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';
import * as cookie from 'cookie';
import { Validator, ValidationError } from '@arikajs/validation';

export class Request {
    private app: Application;
    private req!: IncomingMessage;
    private _session: any = null;
    public searchParams!: URLSearchParams;
    private _cookies: Record<string, string | undefined> | null = null;
    private _body: any = null;
    private _params: Record<string, string> = {};
    private _auth: any = null;
    private _view: any = null;

    constructor(app: Application, req: IncomingMessage) {
        this.app = app;
        if (req) {
            this.reset(req);
        }
    }

    private _baseUrl: string | null = null;

    public reset(req: IncomingMessage | null) {
        if (!req) {
            this.req = null as any;
            return;
        }
        this.req = req;
        (this as any).searchParams = null;
        this._cookies = null;
        this._body = null;
        this._params = {};
        this._baseUrl = null;
        this._session = null;
        this._auth = null;
        this._view = null;
    }

    /**
     * Get the view engine instance.
     */
    get view(): any {
        if (!this._view) {
            try {
                this._view = this.app.make('view');
            } catch (e) {
                return null;
            }
        }
        return this._view;
    }

    set view(value: any) {
        this._view = value;
    }

    /**
     * Get the authentication context for the request.
     */
    get auth(): any {
        if (!this._auth) {
            try {
                const authManager = this.app.make('auth');
                this._auth = authManager.createContext(this);
            } catch (e) {
                // Auth manager not registered
                return null;
            }
        }
        return this._auth;
    }

    set auth(value: any) {
        this._auth = value;
    }

    private ensureSearchParams() {
        if (!(this as any).searchParams && this.req) {
            const url = this.req.url || '/';
            const queryIndex = url.indexOf('?');
            if (queryIndex === -1) {
                (this as any).searchParams = new URLSearchParams();
            } else {
                (this as any).searchParams = new URLSearchParams(url.slice(queryIndex + 1));
            }
        }
    }

    /**
     * Get the base URL (scheme + host) of the request.
     * Falls back to app.url config if host header is missing.
     */
    baseUrl(): string {
        if (this._baseUrl) return this._baseUrl;
        const trustProxy = this.app.config().get('http.trustProxy', false);
        const protocol = trustProxy ? (this.header('x-forwarded-proto') as string || 'http') : 'http';
        const host = trustProxy ? (this.header('x-forwarded-host') as string || this.req.headers.host) : this.req.headers.host;

        if (host) {
            this._baseUrl = `${protocol}://${host}`;
            return this._baseUrl;
        }

        this._baseUrl = this.app.config().get('app.url', 'http://localhost') as string;
        return this._baseUrl;
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
        const url = this.req.url || '/';
        const queryIndex = url.indexOf('?');
        return queryIndex === -1 ? url : url.slice(0, queryIndex);
    }

    /**
     * Get all headers.
     */
    headers(): Record<string, string | string[] | undefined> {
        return this.req.headers;
    }

    /**
     * Get the client IP address.
     */
    ip(): string | undefined {
        const trustProxy = this.app.config().get('http.trustProxy', false);
        if (trustProxy) {
            const forwardedFor = this.header('x-forwarded-for');
            if (typeof forwardedFor === 'string') {
                return forwardedFor.split(',')[0].trim();
            }
        }
        return this.req.socket.remoteAddress;
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
        this.ensureSearchParams();
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
        this.ensureSearchParams();
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

    get session(): any {
        if (!this._session) {
            const store: Record<string, any> = {};
            this._session = {
                get: (key: string) => store[key] ?? null,
                put: (key: string, value: any) => { store[key] = value; },
                forget: (key: string) => { delete store[key]; },
                has: (key: string) => key in store,
                all: () => ({ ...store }),
            };
        }
        return this._session;
    }

    set session(value: any) {
        this._session = value;
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

    /**
     * Determine if the current request is asking for JSON.
     */
    wantsJson(): boolean {
        const acceptable = this.header('accept');
        return typeof acceptable === 'string' &&
            (acceptable.includes('application/json') || acceptable.includes('+json'));
    }

    /**
     * Determine if the current request is an AJAX request.
     */
    ajax(): boolean {
        return this.header('x-requested-with') === 'XMLHttpRequest';
    }

    /**
     * Determine if the current request expects a JSON response.
     */
    expectsJson(): boolean {
        return this.ajax() || this.wantsJson();
    }

    /**
     * Validate the request with the given rules.
     */
    async validate(rules: Record<string, any>, messages: Record<string, any> = {}): Promise<any> {
        const validator = new Validator(this.all(), rules, messages);

        if (await validator.fails()) {
            throw new ValidationError(validator.errors());
        }

        return validator.validated();
    }
}
