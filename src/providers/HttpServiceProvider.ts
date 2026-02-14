
import { ServiceProvider } from '@arikajs/foundation';
import { Router } from '@arikajs/router';
import { Kernel } from '../http/Kernel';
import { Handler } from '../http/Handler';
import { Application } from '../Contracts/Application';

export class HttpServiceProvider extends ServiceProvider<Application> {
    /**
     * Register the service provider.
     */
    public async register(): Promise<void> {
        // Register the Router as a singleton
        this.app.singleton(Router, () => {
            return new Router(this.app.getContainer());
        });

        // Register the Kernel
        this.app.singleton(Kernel, () => {
            return new Kernel(this.app);
        });

        // Register the Exception Handler
        this.app.singleton(Handler, () => {
            return new Handler();
        });
    }

    /**
     * Boot the service provider.
     */
    public async boot(): Promise<void> {
        // Any HTTP-specific booting logic can go here
    }
}
