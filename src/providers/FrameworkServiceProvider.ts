import { ServiceProvider } from '@arikajs/foundation';
import { Encrypter } from '@arikajs/encryption';
import { LoggingServiceProvider } from './LoggingServiceProvider';
import { AuthServiceProvider } from './AuthServiceProvider';
import { ValidationServiceProvider } from './ValidationServiceProvider';
import { DatabaseServiceProvider } from './DatabaseServiceProvider';
import { MailServiceProvider } from './MailServiceProvider';
import { ViewServiceProvider } from './ViewServiceProvider';
import { EventsServiceProvider } from './EventsServiceProvider';
import { SchedulerServiceProvider } from './SchedulerServiceProvider';
import { TranslationServiceProvider } from './TranslationServiceProvider';
import { CacheServiceProvider } from './CacheServiceProvider';
import { QueueServiceProvider } from './QueueServiceProvider';

export class FrameworkServiceProvider extends ServiceProvider {
    public async register() {
        // Register Core Services
        await this.app.register(LoggingServiceProvider);
        await this.app.register(AuthServiceProvider);
        await this.app.register(ValidationServiceProvider);
        await this.app.register(DatabaseServiceProvider);
        await this.app.register(CacheServiceProvider);
        await this.app.register(QueueServiceProvider);
        await this.app.register(MailServiceProvider);
        await this.app.register(ViewServiceProvider);
        await this.app.register(TranslationServiceProvider);
        await this.app.register(EventsServiceProvider);
        await this.app.register(SchedulerServiceProvider);

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
