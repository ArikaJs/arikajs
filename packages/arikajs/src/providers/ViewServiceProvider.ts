
import { ServiceProvider } from '@arikajs/foundation';
import { View } from '@arikajs/view';
import { carbon } from '@arikajs/carbon';
import path from 'path';
import { ViewMiddleware } from '../http/Middleware/ViewMiddleware';
import { Application } from '../Contracts/Application';

export class ViewServiceProvider extends ServiceProvider<Application> {
    /**
     * Register the service provider.
     */
    public async register(): Promise<void> {
        this.app.singleton(View, () => {
            const config = this.app.config();
            const viewsPath = config.get('view.paths', [
                path.join((this.app as any).getBasePath(), 'resources/views')
            ])[0] as string;

            const cachePath = config.get('view.cache_path',
                path.join((this.app as any).getBasePath(), 'storage/framework/views')
            ) as string;

            const view = new View({
                viewsPath,
                cachePath,
                cache: config.get('app.env') === 'production',
                dev: config.get('app.debug', false),
                appKey: config.get('app.key') as string,
                cacheDriver: this.app.has('cache') ? {
                    get: (key: string) => this.app.make<any>('cache').get(`view_cache:${key}`),
                    set: (key: string, value: string, ttl: number) => this.app.make<any>('cache').set(`view_cache:${key}`, value, ttl)
                } : undefined
            });

            // Register standard view helpers
            view.helper('config', (key: string, defaultValue?: any) => config.get(key, defaultValue));
            view.helper('carbon', (dateValue: any) => carbon(dateValue));
            view.helper('date', (dateValue: any, format = 'Y-m-d') => carbon(dateValue).format(format));

            return view;
        });

        this.app.singleton('view', () => this.app.make(View));

        this.app.singleton(ViewMiddleware, () => {
            return new ViewMiddleware(this.app.make(View));
        });
    }

    public async boot(): Promise<void> {
        const view = this.app.make<View>(View);
        
        // Prevent the CLI process from running duplicate watchers
        // We only want the actual HTTP server (server.ts) to watch files.
        const isCli = (global as any).__ARIKA_CLI_BOOTSTRAP__ === true;
        
        if (view.config.dev && !isCli) {
            view.engine().watch();
        }
    }
}
