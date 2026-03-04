import { Command } from '@arikajs/console';
import inquirer from 'inquirer';

export class MakeCommand extends Command {
    public signature = 'make';
    public description = 'Interactive menu to generate application boilerplate';

    public async handle() {
        this.writeln('');
        this.info(' 🪄 ArikaJS Interactive Make');
        this.writeln('');

        const { type } = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'What would you like to generate?',
                choices: [
                    'Controller',
                    'Model',
                    'Migration',
                    'Seeder',
                    'Middleware',
                    'Service Provider',
                    'Console Command',
                    'Event',
                    'Listener',
                    'Job',
                    'View',
                    new inquirer.Separator(),
                    'Cancel'
                ]
            }
        ]);

        if (type === 'Cancel') {
            this.comment('Operation cancelled.');
            return;
        }

        const { name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: `What should we name the ${type}?`,
                validate: (input) => input.trim() !== '' ? true : 'Please enter a name.'
            }
        ]);

        let commandToRun = '';
        const mockRawArgs: string[] = [];

        switch (type) {
            case 'Controller':
                commandToRun = 'make:controller';
                break;
            case 'Migration':
                commandToRun = 'make:migration';
                break;
            case 'Seeder':
                commandToRun = 'make:seeder';
                break;
            case 'Middleware':
                commandToRun = 'make:middleware';
                break;
            case 'Service Provider':
                commandToRun = 'make:provider';
                break;
            case 'Console Command':
                commandToRun = 'make:command';
                break;
            case 'Event':
                commandToRun = 'make:event';
                break;
            case 'Listener':
                commandToRun = 'make:listener';
                break;
            case 'Job':
                commandToRun = 'make:job';
                break;
            case 'View':
                commandToRun = 'make:view';
                break;
            case 'Model': {
                commandToRun = 'make:model';
                const { options } = await inquirer.prompt([
                    {
                        type: 'checkbox',
                        name: 'options',
                        message: 'Include additional files?',
                        choices: [
                            { name: 'Migration', value: '--migration' },
                            { name: 'Controller', value: '--controller' }
                        ]
                    }
                ]);
                mockRawArgs.push(...options);
                break;
            }
        }

        if (commandToRun) {
            this.writeln('');
            await this.registry.run([commandToRun, name, ...mockRawArgs]);
        }
    }
}
