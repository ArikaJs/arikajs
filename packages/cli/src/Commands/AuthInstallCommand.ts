import { Command } from '@arikajs/console';
import inquirer from 'inquirer';

export class AuthInstallCommand extends Command {
    public signature = 'auth:install {--force}';
    public description = 'Interactive menu to scaffold authentication system';

    public async handle() {
        this.writeln('');
        this.info(' 🔐 ArikaJS Authentication Scaffolding');
        this.writeln('');

        const { type } = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Which type of authentication would you like to scaffold?',
                choices: [
                    { name: 'Web (Session-based, includes views)', value: 'web' },
                    { name: 'API (JWT-based, for mobile/SPAs)', value: 'api' },
                    new inquirer.Separator(),
                    { name: 'Cancel', value: 'cancel' }
                ]
            }
        ]);

        if (type === 'cancel') {
            this.comment('Operation cancelled.');
            return;
        }

        const force = this.option('force') ? ' --force' : '';

        if (type === 'web') {
            await this.registry.run(['auth:install:web' + force]);
        } else {
            await this.registry.run(['auth:install:api' + force]);
        }
    }
}
