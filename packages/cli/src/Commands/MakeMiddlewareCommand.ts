
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to generate a new middleware.
 *
 * Usage:
 *   arika make:middleware AuthMiddleware
 *
 * Generates:
 *   app/Http/Middleware/AuthMiddleware.ts
 */
export class MakeMiddlewareCommand extends Command {
    public signature = 'make:middleware {name}';
    public description = 'Create a new middleware class';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Middleware name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Http/Middleware');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Middleware already exists: app/Http/Middleware/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Middleware created: app/Http/Middleware/${fileName}`);
    }

    private getStub(name: string): string {
        return `import { Request, Response, NextFunction } from '@arikajs/http';

/**
 * ${name}
 *
 * This middleware is executed for every matching route.
 * Call next() to pass control to the next middleware or route handler.
 */
export class ${name} {
    /**
     * Handle an incoming request.
     */
    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Perform actions before the request reaches the controller...

        await next();

        // Perform actions after the response is generated...
    }
}
`;
    }
}
