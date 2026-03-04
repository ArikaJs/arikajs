
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to generate a new console command file.
 *
 * Usage:
 *   arika make:command SendReport
 *
 * Generates:
 *   app/Console/Commands/SendReport.ts
 */
export class MakeCommandCommand extends Command {
    public signature = 'make:command {name}';
    public description = 'Create a new Artisan command';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Command name is required.');
            return;
        }

        const commandsDir = path.join(process.cwd(), 'app/Console/Commands');

        if (!fs.existsSync(commandsDir)) {
            fs.mkdirSync(commandsDir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(commandsDir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Command already exists: app/Console/Commands/${fileName}`);
            return;
        }

        const stub = this.getStub(name);
        fs.writeFileSync(filePath, stub);

        this.success(`Command created: app/Console/Commands/${fileName}`);
    }

    /**
     * Get the command stub content.
     */
    private getStub(name: string): string {
        // Convert PascalCase to kebab-case for the signature
        // e.g. SendReport → send:report, CleanupOldData → cleanup:old-data
        const signature = name
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
            .toLowerCase()
            .replace('-', ':');

        return `import { Command } from '@arikajs/console';

export class ${name} extends Command {
    /**
     * The name and signature of the command.
     */
    public signature = '${signature}';

    /**
     * The command description.
     */
    public description = 'Description of the ${signature} command';

    /**
     * Execute the command.
     */
    public async handle() {
        this.info('${name} executed successfully.');

        // Your command logic here...
    }
}
`;
    }
}
