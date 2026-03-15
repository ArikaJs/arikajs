import { Migration, SchemaBuilder } from 'arikajs';

export default class CreateUsersTable extends Migration {
    /**
     * Run the migrations.
     */
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.create('users', (table: any) => {
            table.id();
            table.string('name');
            table.string('email').unique();
            table.timestamp('email_verified_at').nullable();
            table.string('password');
            table.string('remember_token', 100).nullable();
            table.timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('users');
    }
}
