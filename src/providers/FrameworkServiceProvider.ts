import { ServiceProvider } from '@arikajs/foundation';
import { Encrypter } from '@arikajs/encryption';
import { LoggingServiceProvider } from './LoggingServiceProvider';
import { AuthServiceProvider } from './AuthServiceProvider';
import { ValidationServiceProvider } from './ValidationServiceProvider';
import { DatabaseServiceProvider } from './DatabaseServiceProvider';

export class FrameworkServiceProvider extends ServiceProvider {
    public async register() {
        // Register Core Services
        await this.app.register(LoggingServiceProvider);
        await this.app.register(AuthServiceProvider);
        await this.app.register(ValidationServiceProvider);
        await this.app.register(DatabaseServiceProvider);

        // Register framework specific services
        this.app.singleton('encrypter', () => {
            const key = this.app.config().get('app.key');
            return new Encrypter(key as string);
        });
    }

    public async boot() {
        // Boot framework specific services
    }
}
