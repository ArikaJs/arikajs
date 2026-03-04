
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';



export class TemplateManager {
    private templatesDir: string;

    constructor() {
        // Templates are located relative to the dist/src directory when running
        this.templatesDir = path.resolve(__dirname, '../templates');
    }

    /**
     * Resolve the template directory path.
     */
    public resolveTemplatePath(): string {
        const templatePath = path.join(this.templatesDir, 'app');

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template "app" not found in ${this.templatesDir}`);
        }

        return templatePath;
    }

    /**
     * Copy template files to the target directory.
     */
    public copyTemplate(templatePath: string, targetDir: string, appName: string): void {
        this.copyRecursiveSync(templatePath, targetDir);

        // Rename migrations to today's date
        this.renameMigrations(targetDir);

        // Post-process files if needed (e.g., replacing placeholders)
        this.processPlaceholders(targetDir, appName);
    }

    /**
     * Rename migration files in the target directory to use the current date.
     */
    private renameMigrations(targetDir: string): void {
        const migrationsDir = path.join(targetDir, 'database/migrations');
        if (!fs.existsSync(migrationsDir)) return;

        const files = fs.readdirSync(migrationsDir);
        const date = new Date();
        const timestamp = date.getFullYear().toString() + '_' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '_' +
            date.getDate().toString().padStart(2, '0') + '_' +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0');

        files.forEach((file, index) => {
            // Check if file looks like a migration (starts with a date pattern)
            if (/^\d{4}_\d{2}_\d{2}_\d{6}_/.test(file) || file.startsWith('2024_01_01')) {
                const suffix = file.split('_').slice(4).join('_');
                const newTimestamp = timestamp + (date.getSeconds() + index).toString().padStart(2, '0');
                const newName = `${newTimestamp}_${suffix}`;

                fs.renameSync(
                    path.join(migrationsDir, file),
                    path.join(migrationsDir, newName)
                );
            }
        });
    }

    /**
     * Create .env and .env.example if they don't exist.
     */
    public setupEnvironmentFiles(targetDir: string, appName: string): void {
        const examplePath = path.join(targetDir, '.env.example');
        const envPath = path.join(targetDir, '.env');

        if (fs.existsSync(examplePath) && !fs.existsSync(envPath)) {
            let content = fs.readFileSync(examplePath, 'utf8');
            content = content.replace(/APP_NAME=.*/, `APP_NAME=${appName}`);

            // Automatically generate app key
            const appKey = 'base64:' + randomBytes(32).toString('base64');
            if (content.includes('APP_KEY=')) {
                content = content.replace(/APP_KEY=.*/, `APP_KEY=${appKey}`);
            } else {
                content += `\nAPP_KEY=${appKey}\n`;
            }

            fs.writeFileSync(envPath, content);
        }
    }

    private copyRecursiveSync(src: string, dest: string): void {
        const exists = fs.existsSync(src);
        if (!exists) return;

        const stats = fs.statSync(src);
        const isDirectory = stats.isDirectory();

        if (isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(src).forEach((childItemName) => {
                this.copyRecursiveSync(
                    path.join(src, childItemName),
                    path.join(dest, childItemName)
                );
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    private processPlaceholders(targetDir: string, appName: string): void {
        const packageJsonPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            // Replace app name
            pkg.name = appName;

            // Handle local @arikajs dependencies for development
            // templatesDir is /path/to/cli/dist/templates
            // ArikaJs root is /path/to/
            const devWorkspaceRoot = path.resolve(this.templatesDir, '../../../');

            const handleDeps = (deps: any) => {
                if (!deps) return;
                Object.keys(deps).forEach(dep => {
                    let depName = '';

                    if (dep.startsWith('@arikajs/')) {
                        depName = dep.split('/')[1];
                        // Map 'core' package to 'arikajs' directory if 'core' directory doesn't exist
                        if (depName === 'core') {
                            const coreDir = path.join(devWorkspaceRoot, 'core');
                            if (!fs.existsSync(coreDir)) {
                                depName = 'arikajs';
                            }
                        }
                    } else if (dep === 'arikajs') {
                        depName = 'arikajs';
                    }

                    if (depName) {
                        const localPath = path.join(devWorkspaceRoot, depName);
                        if (fs.existsSync(localPath)) {
                            // Calculate relative path from target directory to local package
                            let relativePath = path.relative(targetDir, localPath);
                            // Ensure it starts with ./ or ../
                            if (!relativePath.startsWith('.')) {
                                relativePath = './' + relativePath;
                            }
                            deps[dep] = `file:${relativePath}`;
                        }
                    }
                });
            };

            handleDeps(pkg.dependencies);
            handleDeps(pkg.devDependencies);

            fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        }

        // Replace placeholders in view files
        const viewsDir = path.join(targetDir, 'resources/views');
        if (fs.existsSync(viewsDir)) {
            const files = fs.readdirSync(viewsDir);
            files.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.ark.html')) {
                    const filePath = path.join(viewsDir, file);
                    let content = fs.readFileSync(filePath, 'utf8');
                    content = content.replace(/{{name}}/g, appName);
                    fs.writeFileSync(filePath, content);
                }
            });
        }
    }
}
