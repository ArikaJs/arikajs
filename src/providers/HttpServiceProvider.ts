
import { ServiceProvider } from '@arikajs/foundation';
import { HttpKernel, Router } from '@arikajs/http';

export class HttpServiceProvider extends ServiceProvider {
    /**
     * Register the service provider.
     */
    public async register(): Promise<void> {
        // Register the Router as a singleton
        this.app.singleton(Router, () => {
            const router = new Router();
            router.setApplication(this.app);
            return router;
        });

        // Register the HttpKernel
        this.app.singleton(HttpKernel, () => {
            return new HttpKernel(this.app);
        });
    }

    /**
     * Boot the service provider.
     */
    public async boot(): Promise<void> {
        // Any HTTP-specific booting logic can go here
    }
}
