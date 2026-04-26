
import type { ICommand } from '../CommandRegistry';
import type { CommandRegistry } from '../CommandRegistry';

export class HelpCommand implements ICommand {
    public name = 'help';
    public description = 'Display available commands';

    constructor(private registry: CommandRegistry) {}

    public async handle(_args: string[], _flags: Record<string, string | boolean>): Promise<void> {
        console.log('');
        console.log('\x1b[35m🚀 Arika Deploy\x1b[0m  \x1b[90mZero-config deployment tool for Node.js apps\x1b[0m');
        console.log('');
        console.log('\x1b[33mUsage:\x1b[0m');
        console.log('  arika <command> [options]');
        console.log('');
        console.log('\x1b[33mAvailable Commands:\x1b[0m');

        const commands = this.registry.all();
        const maxLen = Math.max(...Array.from(commands.keys()).map(k => k.length));

        for (const [name, cmd] of commands.entries()) {
            const padding = ' '.repeat(maxLen - name.length + 2);
            console.log(`  \x1b[36m${name}\x1b[0m${padding}\x1b[90m${cmd.description}\x1b[0m`);
        }

        console.log('');
        console.log('\x1b[33mOptions:\x1b[0m');
        console.log('  \x1b[36m--yes\x1b[0m        \x1b[90mSkip interactive prompts, use saved config\x1b[0m');
        console.log('  \x1b[36m--nginx\x1b[0m      \x1b[90mForce Nginx as web server\x1b[0m');
        console.log('  \x1b[36m--apache\x1b[0m     \x1b[90mForce Apache as web server\x1b[0m');
        console.log('  \x1b[36m--no-nginx\x1b[0m   \x1b[90mSkip web server configuration\x1b[0m');
        console.log('  \x1b[36m--no-ssl\x1b[0m     \x1b[90mDisable SSL setup\x1b[0m');
        console.log('');
        console.log('\x1b[33mExamples:\x1b[0m');
        console.log('  \x1b[37marika deploy\x1b[0m');
        console.log('  \x1b[37marika deploy --yes\x1b[0m');
        console.log('  \x1b[37marika deploy --nginx --no-ssl\x1b[0m');
        console.log('  \x1b[37marika logs --error\x1b[0m');
        console.log('  \x1b[37marika doctor\x1b[0m');
        console.log('');
    }
}
