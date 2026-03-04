import { ServiceProvider, Route } from 'arikajs';
import path from 'path';

export class RouteServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public register(): void {
        // 
    }

    /**
     * Bootstrap any application services.
     */
    public boot(): void {
        this.loadRoutes();
    }

    /**
     * Load the application routes.
     */
    protected loadRoutes(): void {
        const basePath = (this.app as any).getBasePath();

        // 1. Load web routes (default, no prefix)
        Route.group({}, () => {
            require(path.join(basePath, 'routes/web'));
        });

        // 2. Load API routes with /api prefix
        Route.group({ prefix: 'api' }, () => {
            require(path.join(basePath, 'routes/api'));
        });
    }
}
