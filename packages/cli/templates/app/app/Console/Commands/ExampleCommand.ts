import { Command } from 'arikajs';

export class ExampleCommand extends Command {

    public signature: string = 'app:example';

    public description: string = 'An example command to demonstrate the ArikaJS CLI.';

    public async handle(): Promise<void> {
        const name = this.option('name', 'World');

        this.info(`Hello, ${name}! Your ArikaJS console is working perfectly.`);
    }
}
