
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to create a new seeder file
 */
export class MakeSeederCommand extends Command {
    public signature = 'make:seeder {name}';
    public description = 'Create a new seeder file';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Seeder name is required.');
            return;
        }

        const fileName = `${name}.ts`;
        const seedersDir = path.join(process.cwd(), 'database/seeders');

        if (!fs.existsSync(seedersDir)) {
            fs.mkdirSync(seedersDir, { recursive: true });
        }

        const filePath = path.join(seedersDir, fileName);
        const stub = this.getStub(name);

        fs.writeFileSync(filePath, stub);
        this.info(`Seeder created: database/seeders/${fileName}`);
    }

    /**
     * Get the seeder stub content
     */
    private getStub(name: string): string {
        return `import { Seeder, DatabaseManager } from '@arikajs/database';

export default class ${name} extends Seeder {
    /**
     * Run the database seeds.
     */
    public async run(db: DatabaseManager): Promise<void> {
        // await db.table('users').insert({
        //     name: 'John Doe',
        //     email: 'john@example.com'
        // });
    }
}
`;
    }
}
