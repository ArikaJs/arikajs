import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class MakeListenerCommand extends Command {
    public signature = 'make:listener {name}';
    public description = 'Create a new event listener class';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Listener name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Listeners');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Listener already exists: app/Listeners/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Listener created: app/Listeners/${fileName}`);
    }

    private getStub(name: string): string {
        return `export class ${name} {
    /**
     * Create the event listener.
     */
    constructor() {
        //
    }

    /**
     * Handle the event.
     */
    public async handle(event: any): Promise<void> {
        // Handle the event
    }
}
`;
    }
}
