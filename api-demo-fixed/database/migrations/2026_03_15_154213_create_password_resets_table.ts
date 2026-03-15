import { Migration, SchemaBuilder } from 'arikajs';

export default class CreatePasswordResetsTable extends Migration {
    /**
     * Run the migrations.
     */
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.create('password_resets', (table: any) => {
            table.string('email');
            table.index('email');
            table.string('token');
            table.timestamp('created_at').nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('password_resets');
    }
}
