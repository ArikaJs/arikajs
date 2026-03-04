import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to generate a new controller.
 *
 * Usage:
 *   arika make:controller UserController
 *
 * Generates:
 *   app/Http/Controllers/UserController.ts
 */
export class MakeControllerCommand extends Command {
    public signature = 'make:controller {name}';
    public description = 'Create a new controller class';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Controller name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Http/Controllers');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Controller already exists: app/Http/Controllers/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Controller created: app/Http/Controllers/${fileName}`);
    }

    private getStub(name: string): string {
        return `import { Request, Response } from '@arikajs/http';

export class ${name} {
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
    }
}
