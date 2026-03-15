
import { Application } from './Application';
import { Route } from '@arikajs/router';
import { Log } from '@arikajs/logging';
import { Translator } from '@arikajs/localization';
import { env as configEnv } from '@arikajs/config';

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
 * Render a view template or get the view engine.
 */
export function view(template?: string, data: any = {}): any {
    const engine = app().make('view') as any;
    if (template === undefined) return engine;
    return engine.render(template, data);
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
