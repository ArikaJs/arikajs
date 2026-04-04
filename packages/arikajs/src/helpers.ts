
import { Application } from './Application';
import { Route } from '@arikajs/router';
import { Log } from '@arikajs/logging';
import { Translator } from '@arikajs/localization';
import { env as configEnv } from '@arikajs/config';
import { carbon as carbonFactory } from '@arikajs/carbon';

/**
 * Get the application instance.
 */
let appInstance: Application | null = null;

export function setApp(app: Application) {
    appInstance = app;
}

export function app(): Application {
    if (!appInstance) {
        throw new Error('Application instance not set.');
    }
    return appInstance;
}

/**
 * Get a configuration value.
 */
export function config<T = any>(key?: string, defaultValue: T = null as any): T {
    const repository = app().config();
    if (!key) return repository as any;
    return repository.get(key, defaultValue);
}

/**
 * Get an environment variable.
 */
export function env<T = any>(key: string, defaultValue?: T): T {
    return configEnv(key, defaultValue);
}

/**
 * Log an info message.
 */
export function info(message: string, context: any = {}) {
    Log.info(message, context);
}

/**
 * Log an error message.
 */
export function error(message: string, context: any = {}) {
    Log.error(message, context);
}

/**
 * Log a warning message.
 */
export function warning(message: string, context: any = {}) {
    Log.warning(message, context);
}

/**
 * Log a debug message.
 */
export function debug(message: string, context: any = {}) {
    Log.debug(message, context);
}

/**
 * Generate a URL for a named route.
 */
export function route(name: string, params: any = {}): string {
    return app().getRouter().route(name, params);
}

/**
 * Translate the given message.
 */
export function lang(key: string, replace: Record<string, any> = {}, locale: string | null = null): string {
    return (app().make(Translator) as Translator).get(key, replace, locale);
}

// Alias for common patterns
export const trans = lang;
export const __ = lang;

/**
 * Get the current request instance.
 */
export function request(): any {
    return (app() as any).currentRequest;
}

/**
 * Get the current auth context or manager.
 */
export function auth(): any {
    const req = request();
    if (req && req.auth) {
        return req.auth;
    }
    return app().make('auth');
}

/**
 * Render a view template or get the view engine.
 */
export async function view(template?: string, data: any = {}): Promise<any> {
    const req = request();
    
    // Capture synchronous stack trace so that framework errors show the exact application file calling view()
    const callStack = new Error().stack || '';

    const enrichError = (err: any) => {
        if (err && err.stack) {
            // Keep the original error type but append the caller application stack trace
            const framesToKeep = callStack.split('\n').slice(2); // Remove Error and view() frame
            err.stack = err.stack + '\n' + framesToKeep.join('\n');
        }
        return err;
    };

    try {
        // 1. If we are in a request context and req.view.render exists, use it!
        // This is the preferred way as it handles session errors, CSRF, etc. correctly
        if (req && req.view && typeof req.view.render === 'function') {
            if (template === undefined) return req.view;
            return await req.view.render(template, data);
        }

        // 2. Fallback to global view engine
        const engine = app().make('view') as any;
        if (template === undefined) return engine;

        return await engine.render(template, data);
    } catch (err) {
        throw enrichError(err);
    }
}

/**
 * Create a new Carbon instance for date manipulation.
 */
export function carbon(date?: any): any {
    return carbonFactory(date);
}

/**
 * Format the given date.
 */
export function date(date?: any, format = 'Y-m-d'): string {
    return carbon(date).format(format);
}

// Add properties to support view.render() and view.share() as seen in the README
view.render = (template: string, data: any = {}) => {
    return (app().make('view') as any).render(template, data);
};

view.share = (key: string, value: any) => {
    return (app().make('view') as any).share(key, value);
};

view.composer = (template: string, callback: any) => {
    return (app().make('view') as any).composer(template, callback);
};
