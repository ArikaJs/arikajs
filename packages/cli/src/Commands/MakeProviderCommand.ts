
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

/**
 * Command to generate a new service provider.
 *
 * Usage:
 *   arika make:provider PaymentServiceProvider
 *
 * Generates:
 *   app/Providers/PaymentServiceProvider.ts
 */
export class MakeProviderCommand extends Command {
    public signature = 'make:provider {name}';
    public description = 'Create a new service provider';

    public async handle() {
        const name = this.argument('name');
        if (!name) {
            this.error('Provider name is required.');
            return;
        }

        const dir = path.join(process.cwd(), 'app/Providers');

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileName = `${name}.ts`;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            this.error(`Provider already exists: app/Providers/${fileName}`);
            return;
        }

        fs.writeFileSync(filePath, this.getStub(name));
        this.success(`Provider created: app/Providers/${fileName}`);
    }

    private getStub(name: string): string {
        return `import { ServiceProvider } from '@arikajs/foundation';

export class ${name} extends ServiceProvider {
    /**
     * Register any application services.
     *
     * This is called before any boot() methods run.
     * Use this to bind services into the container.
     */
    public async register(): Promise<void> {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * This is called after all providers have been registered.
     * You can safely resolve services from the container here.
     */
    public async boot(): Promise<void> {
        //
    }
}
`;
    }
}
