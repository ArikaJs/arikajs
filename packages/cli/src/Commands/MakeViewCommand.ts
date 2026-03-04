import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class MakeViewCommand extends Command {
    public signature = 'make:view {name}';
    public description = 'Create a new Arika view template';

    public async handle() {
        const name = this.argument('name');
        const cwd = process.cwd();

        const viewPath = path.join(cwd, 'resources', 'views', name.replace(/\./g, path.sep) + '.ark.html');
        const dir = path.dirname(viewPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(viewPath)) {
            this.error('View already exists!');
            return;
        }

        const stub = `<div>
    <!-- Your view content here -->
</div>
`;

        fs.writeFileSync(viewPath, stub);
        this.success(`View created successfully: resources/views/${name}.ark.html`);
    }
}
