
import { ServiceProvider } from '@arikajs/foundation';
import { Router } from '@arikajs/router';
import { Kernel } from '../http/Kernel';

export class HttpServiceProvider extends ServiceProvider {
    /**
     * Register the service provider.
     */
    public async register(): Promise<void> {
        // Register the Router as a singleton
        this.app.singleton(Router, () => {
            return new Router(this.app.getContainer() as any);
        });

        // Register the Kernel
        this.app.singleton(Kernel, () => {
            return new Kernel(this.app as any);
        });
    }

    /**
     * Boot the service provider.
     */
    public async boot(): Promise<void> {
        // Any HTTP-specific booting logic can go here
    }
}
