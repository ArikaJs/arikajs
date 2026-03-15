import { Migration, SchemaBuilder } from 'arikajs';

export default class CreateFailedJobsTable extends Migration {
    /**
     * Run the migrations.
     */
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.create('failed_jobs', (table: any) => {
            table.id();
            table.string('uuid').unique();
            table.text('connection');
            table.text('queue');
            table.text('payload');
            table.text('exception');
            table.timestamp('failed_at').nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('failed_jobs');
    }
}
