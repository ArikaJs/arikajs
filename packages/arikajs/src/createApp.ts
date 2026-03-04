
import { Application } from './Application';

/**
 * Helper to create a new ArikaJS application instance.
 */
export function createApp(basePath?: string): Application {
    return new Application(basePath);
}
