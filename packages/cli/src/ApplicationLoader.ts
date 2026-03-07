
import path from 'path';
import fs from 'fs';

export class ApplicationLoader {
    public static findRoot(): string {
        let current = process.cwd();

        while (current !== path.dirname(current)) {
            if (fs.existsSync(path.join(current, 'package.json'))) {
                return current;
            }
            current = path.dirname(current);
        }

        return process.cwd();
    }

    public static async load() {
        const root = this.findRoot();
        const bootstrapPath = path.join(root, 'bootstrap', 'app.ts');

        if (fs.existsSync(bootstrapPath)) {
            // Register ts-node to handle .ts files
            require('ts-node/register');

            try {
                // Require the app file, which should call createApp() and set the instance
                const appModule = require(bootstrapPath);
                const app = appModule.default || appModule;

                return {
                    root,
                    instance: app,
                    isArikaProject: true
                };
            } catch (error: any) {
                console.error(`Failed to load application at ${bootstrapPath}:`, error.message);
            }
        }

        return {
            root,
            isArikaProject: fs.existsSync(path.join(root, 'arika.json')) || fs.existsSync(path.join(root, 'kernel.ts'))
        };
    }
}
