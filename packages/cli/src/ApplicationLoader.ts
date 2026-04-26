
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
                
                // Try to read tsconfig for aliases
                let alias = {};
                const tsconfigPath = path.join(root, 'tsconfig.json');
                if (fs.existsSync(tsconfigPath)) {
                    try {
                        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
                        if (tsconfig.compilerOptions?.paths) {
                            const paths = tsconfig.compilerOptions.paths;
                            Object.entries(paths).forEach(([key, value]: [string, any]) => {
                                const aliasKey = key.replace('/*', '');
                                const aliasValue = value[0].replace('/*', '');
                                (alias as any)[aliasKey] = path.join(root, aliasValue);
                            });
                        }
                    } catch (e) {
                        // Ignore tsconfig parsing errors
                    }
                }

                const jiti = createJiti(typeof __filename !== 'undefined' ? __filename : process.cwd(), {
                    interopDefault: true,
                    alias
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
