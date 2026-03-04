
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export class NewCommand extends Command {
    public signature = 'new {name}';
    public description = 'Create a new ArikaJS application';

    public async handle() {
        const name = this.argument('name');
        const targetDir = path.resolve(process.cwd(), name);
        const relativePath = path.relative(process.cwd(), targetDir) || '.';

        if (fs.existsSync(targetDir)) {
            this.error(`Directory "${name}" already exists.`);
            return;
        }

        const { TemplateManager } = await import('../TemplateManager');
        const templateManager = new TemplateManager();

        this.writeln('');
        this.info(` 🚀 Creating a new ArikaJS application: ${name}`);
        this.writeln('');

        const shouldInstall = await this.confirm('Would you like to install dependencies automatically?', true);

        try {
            const templatePath = templateManager.resolveTemplatePath();

            await this.task(`Scaffolding project in ${targetDir}`, async () => {
                templateManager.copyTemplate(templatePath, targetDir, name);
                templateManager.setupEnvironmentFiles(targetDir, name);
            });

            if (shouldInstall) {
                this.writeln('');
                this.info(' 📦 Installing dependencies...');
                this.writeln('');
                await this.installDependencies(targetDir);
            }

            this.writeln('');
            this.success('Project created successfully!');
            this.writeln('');
            this.comment(' Next steps:');
            this.comment(`  - cd ${relativePath}`);
            if (!shouldInstall) {
                this.comment('  - npm install');
            }
            this.comment('  - npm run dev');
            this.writeln('');
            this.info(' Happy coding with ArikaJS!');
            this.writeln('');

        } catch (error: any) {
            this.writeln('');
            this.error(`Failed to create project: ${error.message}`);
        }
    }

    private async installDependencies(targetDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const pkgPath = path.join(targetDir, 'package.json');
            let pkgObj: any = null;

            try {
                if (fs.existsSync(pkgPath)) {
                    const pkgStr = fs.readFileSync(pkgPath, 'utf8');
                    pkgObj = JSON.parse(pkgStr);
                    const strippedPkg = JSON.parse(pkgStr);

                    // Temporarily strip file: references so npm doesn't freeze traversing local deps
                    ['dependencies', 'devDependencies'].forEach(section => {
                        if (strippedPkg[section]) {
                            for (const key of Object.keys(strippedPkg[section])) {
                                if (strippedPkg[section][key].startsWith('file:')) {
                                    delete strippedPkg[section][key];
                                }
                            }
                        }
                    });
                    fs.writeFileSync(pkgPath, JSON.stringify(strippedPkg, null, 2));
                }
            } catch (e) {
                // Ignore error
            }

            const child = spawn('npm', [
                'install',
                '--no-package-lock',
                '--legacy-peer-deps',
                '--ignore-scripts',
                '--prefer-offline',
                '--no-audit',
                '--no-fund'
            ], {
                cwd: targetDir,
                stdio: 'inherit',
                shell: true
            });

            child.on('close', (code) => {
                if (pkgObj) {
                    // Restore original package.json after install completes
                    fs.writeFileSync(pkgPath, JSON.stringify(pkgObj, null, 2));

                    // Manually symlink local dependencies into node_modules
                    const nodeModulesPath = path.join(targetDir, 'node_modules');
                    if (!fs.existsSync(nodeModulesPath)) {
                        fs.mkdirSync(nodeModulesPath);
                    }

                    ['dependencies', 'devDependencies'].forEach(section => {
                        if (pkgObj[section]) {
                            for (const key of Object.keys(pkgObj[section])) {
                                const val = pkgObj[section][key];
                                if (val.startsWith('file:')) {
                                    const sourcePath = path.resolve(targetDir, val.replace('file:', ''));
                                    const targetLinkPath = path.join(nodeModulesPath, key);

                                    // Handle @scoped/packages directories
                                    const scopeMatch = key.match(/^(@[^/]+)\/(.+)$/);
                                    if (scopeMatch) {
                                        const scopeDir = path.join(nodeModulesPath, scopeMatch[1]);
                                        if (!fs.existsSync(scopeDir)) {
                                            fs.mkdirSync(scopeDir, { recursive: true });
                                        }
                                    }

                                    try {
                                        if (fs.existsSync(targetLinkPath)) fs.unlinkSync(targetLinkPath);
                                        fs.symlinkSync(sourcePath, targetLinkPath, 'dir');
                                    } catch (err) {
                                        // Ignore symlink failure
                                    }
                                }
                            }
                        }
                    });
                }

                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`npm install failed with exit code ${code}`));
                }
            });
        });
    }
}
