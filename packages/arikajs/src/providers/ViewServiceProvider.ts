
import { ServiceProvider } from '@arikajs/foundation';
import { View } from '@arikajs/view';
import path from 'path';
import { ViewMiddleware } from '../http/Middleware/ViewMiddleware';

export class ViewServiceProvider extends ServiceProvider {
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

            return new View({
                viewsPath,
                cachePath,
                cache: config.get('app.env') === 'production'
            });
        });

        this.app.singleton('view', () => this.app.make(View));

        this.app.singleton(ViewMiddleware, () => {
            return new ViewMiddleware(this.app.make(View));
        });
    }

    /**
     * Boot the service provider.
     */
    public async boot(): Promise<void> {
        //
    }
}
