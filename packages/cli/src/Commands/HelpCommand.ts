
import { Command } from '@arikajs/console';

export class HelpCommand extends Command {
    public signature = 'help {command_name?}';
    public description = 'Display help for a command';

    public async handle() {
        const name = this.argument('command_name');

        if (!name) {
            this.writeln('');
            this.info(' ArikaJS CLI Help');
            this.writeln('');

            const commands = this.registry.all();
            const grouped: Record<string, any[]> = {};

            for (const [name, data] of commands.entries()) {
                const group = name.includes(':') ? name.split(':')[0] : 'General';
                if (!grouped[group]) grouped[group] = [];
                grouped[group].push([name, data.description || '']);
            }

            // Sort groups and display tables
            const sortedGroups = Object.keys(grouped).sort();

            for (const groupName of sortedGroups) {
                this.comment(` ${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`);
                this.table(
                    ['Command', 'Description'],
                    grouped[groupName].sort((a, b) => a[0].localeCompare(b[0]))
                );
                this.writeln('');
            }

            this.comment(' Usage:');
            this.writeln('  arika help <command_name>');
            this.writeln('');
            return;
        }

        const commands = this.registry.all();
        const data = commands.get(name);

        if (!data) {
            this.error(`Command "${name}" not found.`);
            return;
        }

        this.writeln('');
        this.info(` Help for command: ${name}`);
        this.writeln('');
        
        this.comment(' Description:');
        this.writeln(`  ${data.description || 'No description available.'}`);
        this.writeln('');
        
        this.comment(' Usage:');
        this.writeln(`  arika ${data.signature}`);
        this.writeln('');
    }
}
