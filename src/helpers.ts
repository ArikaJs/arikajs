
import { Application } from './Application';
import { Route } from '@arikajs/router';
import { Log } from '@arikajs/logging';

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
export function config(key?: string, defaultValue: any = null): any {
    const repository = app().config();
    if (!key) return repository;
    return repository.get(key, defaultValue);
}

/**
 * Log an info message.
 */
export function info(message: string, context: any = {}) {
    Log.info(message, context);
}

/**
 * Generate a URL for a named route.
 */
export function route(name: string, params: any = {}): string {
    return app().getRouter().route(name, params);
}
