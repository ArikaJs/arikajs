
import { ServiceProvider } from '@arikajs/foundation';
import { DocsGenerateCommand } from './Commands/DocsGenerateCommand.js';
import { DocsInstallCommand } from './Commands/DocsInstallCommand.js';

export class DocsServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public async register() {
    }

    /**
     * Bootstrap any application services.
     */
    public async boot() {
        this.loadCommands([
            DocsGenerateCommand,
            DocsInstallCommand
        ]);
    }
}
