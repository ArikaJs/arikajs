
import { Command } from '@arikajs/console';

export class ListCommand extends Command {
    public signature = 'list';
    public description = 'List all available commands';

    public async handle() {
        this.writeln('');
        this.info(' ArikaJS CLI');
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
    }
}
