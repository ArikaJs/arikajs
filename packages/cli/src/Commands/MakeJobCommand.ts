import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class MakeJobCommand extends Command {
    public signature = 'make:job {name}';
    public description = 'Create a new job class';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Job name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Jobs');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Job already exists: app/Jobs/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Job created: app/Jobs/${fileName}`);
    }

    private getStub(name: string): string {
        return `export class ${name} {
    /**
     * Create a new job instance.
     */
    constructor() {
        //
    }

    /**
     * Execute the job.
     */
    public async handle(): Promise<void> {
        // Job logic goes here
    }
}
`;
    }
}
