
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class CacheTableCommand extends Command {
    public signature = 'cache:table';
    public description = 'Create a migration for the cache database table';

    public async handle() {
        const migrationsDir = path.join(process.cwd(), 'database/migrations');

        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
        const fileName = `${timestamp}_create_cache_table.ts`;
        const filePath = path.join(migrationsDir, fileName);

        const content = `import { Schema, Blueprint } from '@arikajs/database';

export default class CreateCacheTable {
    public async up() {
        await Schema.create('cache', (table: Blueprint) => {
            table.string('key').unique();
            table.mediumText('value');
            table.integer('expiration').nullable();
        });
    }

    public async down() {
        await Schema.dropIfExists('cache');
    }
}
`;

        fs.writeFileSync(filePath, content);
        this.info(`Migration created: ${filePath}`);
    }
}
