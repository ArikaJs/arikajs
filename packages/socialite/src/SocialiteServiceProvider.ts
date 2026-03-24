
import { ServiceProvider } from '@arikajs/foundation';
import { SocialiteManager, setSocialiteManager } from './index.js';

export class SocialiteServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public async register() {
        this.app.singleton('socialite', (app: any) => {
            const config = app.make('config').get('socialite');
            return new SocialiteManager(config);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public async boot() {
        const manager = this.app.make('socialite');
        setSocialiteManager(manager);
    }
}
