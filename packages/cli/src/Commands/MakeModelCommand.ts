
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to generate a new model.
 *
 * Usage:
 *   arika make:model User
 *   arika make:model User --migration
 *
 * Generates:
 *   app/Models/User.ts
 *   (optionally) database/migrations/YYYYMMDDHHMMSS_create_users_table.ts
 */
export class MakeModelCommand extends Command {
    public signature = 'make:model {name} {--migration} {--controller} {--mc}';
    public description = 'Create a new Eloquent model';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Model name is required.');
            return;
        }

        // Create the model
        const modelsDir = path.join(process.cwd(), 'app/Models');

        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(modelsDir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Model already exists: app/Models/${fileName}`);
        } else {
            fs.writeFileSync(filePath, this.getModelStub(name));
            this.success(`Model created: app/Models/${fileName}`);
        }

        // Create migration if requested
        if (this.option('migration') || this.option('mc')) {
            this.createMigration(name);
        }

        // Create controller if requested
        if (this.option('controller') || this.option('mc')) {
            this.createController(name);
        }
    }

    private getModelStub(name: string): string {
        const tableName = this.toTableName(name);

        return `import { Model } from 'arikajs';

export class ${name} extends Model {
    protected static table = '${tableName}';

    /**
     * The attributes that are mass assignable.
     */
    protected fillable: string[] = [
        //
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected hidden: string[] = [
        //
    ];

    /**
     * The attributes that should be cast.
     */
    protected casts: Record<string, 'string' | 'boolean' | 'object' | 'int' | 'integer' | 'real' | 'float' | 'double' | 'bool' | 'array' | 'json' | 'date' | 'datetime' | 'timestamp'> = {
        //
    };
}
`;
    }

    private createMigration(name: string): void {
        const tableName = this.toTableName(name);
        const migrationsDir = path.join(process.cwd(), 'database/migrations');

        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const date = new Date();
        const timestamp = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0') +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');

        const migrationFileName = `${timestamp}_create_${tableName}_table.ts`;
        const migrationPath = path.join(migrationsDir, migrationFileName);

        const stub = `import { Migration, SchemaBuilder } from 'arikajs';

export default class Create${name}sTable extends Migration {
    /**
     * Run the migrations.
     */
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.create('${tableName}', (table) => {
            table.id();
            table.timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('${tableName}');
    }
}
`;

        fs.writeFileSync(migrationPath, stub);
        this.success(`Migration created: database/migrations/${migrationFileName}`);
    }

    private createController(name: string): void {
        const controllerName = `${name}Controller`;
        const dir = path.join(process.cwd(), 'app/Http/Controllers');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${controllerName}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Controller already exists: app/Http/Controllers/${fileName}`);
            return;
        }

        const stub = `import { Request, Response } from 'arikajs';

export class ${controllerName} {
    /**
     * Display a listing of the resource.
     */
    public async index(req: Request, res: Response) {
        return res.json({ message: 'List of resources' });
    }

    /**
     * Store a newly created resource in storage.
     */
    public async store(req: Request, res: Response) {
        return res.json({ message: 'Resource created' }, 201);
    }

    /**
     * Display the specified resource.
     */
    public async show(req: Request, res: Response) {
        const id = req.param('id');
        return res.json({ message: \`Showing resource \${id}\` });
    }

    /**
     * Update the specified resource in storage.
     */
    public async update(req: Request, res: Response) {
        const id = req.param('id');
        return res.json({ message: \`Resource \${id} updated\` });
    }

    /**
     * Remove the specified resource from storage.
     */
    public async destroy(req: Request, res: Response) {
        const id = req.param('id');
        return res.json({ message: \`Resource \${id} deleted\` });
    }
}
`;

        fs.writeFileSync(filePath, stub);
        this.success(`Controller created: app/Http/Controllers/${fileName}`);
    }

    /**
     * Convert a PascalCase model name to a snake_case plural table name.
     * e.g. User → users, BlogPost → blog_posts, OrderItem → order_items
     */
    private toTableName(name: string): string {
        return name
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase() + 's';
    }
}
