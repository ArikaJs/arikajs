
import { ServiceProvider } from '@arikajs/foundation';
import { LogManager, Log } from '@arikajs/logging';

export class LoggingServiceProvider extends ServiceProvider {
    public async register() {
        this.app.singleton('log', () => {
            const config = this.app.config().get('logging');
            return new LogManager(config);
        });
    }

    public async boot() {
        const logManager = this.app.make<LogManager>('log');
        Log.setManager(logManager);
    }
}
