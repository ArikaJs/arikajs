
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

        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
        const fileName = `${timestamp}_create_jobs_table.ts`;
        const filePath = path.join(migrationsDir, fileName);

        const content = `import { Schema, Blueprint } from '@arikajs/database';

export default class CreateJobsTable {
    public async up() {
        await Schema.create('jobs', (table: Blueprint) => {
            table.id();
            table.string('queue').index();
            table.longText('payload');
            table.unsignedTinyInteger('attempts');
            table.unsignedInteger('reserved_at').nullable();
            table.unsignedInteger('available_at');
            table.unsignedInteger('created_at');
        });
    }

    public async down() {
        await Schema.dropIfExists('jobs');
    }
}
`;

        fs.writeFileSync(filePath, content);
        this.info(`Migration created: ${filePath}`);
    }
}
