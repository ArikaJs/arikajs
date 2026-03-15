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

        // 1. Load web routes (with session, CSRF, etc.)
        Route.middleware('web').group(() => {
            require(path.join(basePath, 'routes/web'));
        });

        // 2. Load API routes with /api prefix (stateless, auth via JWT)
        Route.middleware('api').prefix('api').group(() => {
            require(path.join(basePath, 'routes/api'));
        });
    }
}
