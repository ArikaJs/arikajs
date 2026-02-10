import { ServiceProvider } from '@arikajs/foundation';
import { Encrypter } from '@arikajs/encryption';

export class FrameworkServiceProvider extends ServiceProvider {
    public async register() {
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
