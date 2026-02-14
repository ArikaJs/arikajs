
import { ServiceProvider } from '@arikajs/foundation';
import { AuthManager, Authenticate } from '@arikajs/auth';

export class AuthServiceProvider extends ServiceProvider {
    /**
     * Register the authentication services.
     */
    public async register() {
        this.app.singleton('auth', () => {
            return new AuthManager(this.app.config().get('auth', {}));
        });

        this.app.bind(AuthManager, () => this.app.resolve('auth'));

        // Register the authentication middleware
        this.app.bind(Authenticate, () => {
            return new Authenticate(this.app.resolve(AuthManager));
        });
    }

    /**
     * Boot the authentication services.
     */
    public async boot() {
        // Here we could register default guards etc.
    }
}
