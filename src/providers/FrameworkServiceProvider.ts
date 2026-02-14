import { ServiceProvider } from '@arikajs/foundation';
import { Encrypter } from '@arikajs/encryption';
import { LoggingServiceProvider } from '@arikajs/logging';

export class FrameworkServiceProvider extends ServiceProvider {
    public async register() {
        // Register Logging Service
        await this.app.register(LoggingServiceProvider);

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
