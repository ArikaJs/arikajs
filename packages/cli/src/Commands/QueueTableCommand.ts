
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class QueueTableCommand extends Command {
    public signature = 'queue:table';
    public description = 'Create a migration for the queue jobs database table';

    public async handle() {
        const migrationsDir = path.join(process.cwd(), 'database/migrations');

        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const date = new Date();
        const timestamp = date.getFullYear().toString() + '_' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '_' +
            date.getDate().toString().padStart(2, '0') + '_' +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');

        const fileName = `${timestamp}_create_jobs_table.ts`;
        const filePath = path.join(migrationsDir, fileName);

        const content = `import { Migration, SchemaBuilder } from 'arikajs';

export default class CreateJobsTable extends Migration {
    public async up(schema: SchemaBuilder) {
        await schema.create('jobs', (table: any) => {
            table.id();
            table.string('queue');
            table.text('payload');
            table.integer('attempts');
            table.integer('reserved_at').nullable();
            table.integer('available_at');
            table.integer('created_at');
        });
    }

    public async down(schema: SchemaBuilder) {
        await schema.dropIfExists('jobs');
    }
}
`;

        fs.writeFileSync(filePath, content);
        this.info(`Migration created: ${filePath}`);
    }
}
