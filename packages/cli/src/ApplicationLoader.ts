
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
            try {
                const { createJiti } = await import('jiti');
                const jiti = createJiti(typeof __filename !== 'undefined' ? __filename : process.cwd(), {
                    interopDefault: true
                });
                const appModule = await jiti.import(bootstrapPath) as any;
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
