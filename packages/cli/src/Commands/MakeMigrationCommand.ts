
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to create a new migration file
 */
export class MakeMigrationCommand extends Command {
    public signature = 'make:migration {name}';
    public description = 'Create a new migration file';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Migration name is required.');
            return;
        }

        const date = new Date();
        const timestamp = date.getFullYear().toString() + '_' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '_' +
            date.getDate().toString().padStart(2, '0') + '_' +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');

        const fileName = `${timestamp}_${name}.ts`;
        const migrationsDir = path.join(process.cwd(), 'database/migrations');

        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const filePath = path.join(migrationsDir, fileName);
        const stub = this.getStub(name);

        fs.writeFileSync(filePath, stub);
        this.info(`Migration created: database/migrations/${fileName}`);
    }

    /**
     * Get the migration stub content
     */
    private getStub(name: string): string {
        const className = name.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

        return `import { Migration, SchemaBuilder } from 'arikajs';

export default class ${className} extends Migration {
    /**
     * Run the migrations.
     */
    public async up(schema: SchemaBuilder): Promise<void> {
        // await schema.create('table_name', (table) => {
        //     table.id();
        //     table.string('name');
        //     table.timestamps();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public async down(schema: SchemaBuilder): Promise<void> {
        // await schema.dropIfExists('table_name');
    }
}
`;
    }
}
