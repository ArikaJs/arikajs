import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class MakeEventCommand extends Command {
    public signature = 'make:event {name}';
    public description = 'Create a new event class';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Event name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Events');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Event already exists: app/Events/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Event created: app/Events/${fileName}`);
    }

    private getStub(name: string): string {
        return `export class ${name} {
    /**
     * Create a new event instance.
     */
    constructor() {
        //
    }
}
`;
    }
}
