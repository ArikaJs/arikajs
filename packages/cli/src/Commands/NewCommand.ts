
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

            this.progressStart(100, 'initializing project scaffolding...');

            // Stage 1: Scaffolding (15%)
            templateManager.copyTemplate(templatePath, targetDir, name);
            this.progressAdvance(15, 'setting up environment and files...');

            // Stage 2: Environment setup (10%)
            templateManager.setupEnvironmentFiles(targetDir, name);
            this.progressAdvance(10, shouldInstall ? 'preparing dependency installation...' : 'finishing project setup...');

            if (shouldInstall) {
                // Stage 3: Dependency installation (75%)
                // Since npm install takes a long time, we'll use a timer to simulate progress up to 95%
                // while the installation runs in the background.
                const installPromise = this.installDependencies(targetDir, true);
                
                let currentSubPercent = 0;
                const progressInterval = setInterval(() => {
                    // Slowly increment to 95% total (we've already done 25%)
                    // 75% total is the target for this stage
                    if (currentSubPercent < 70) {
                        const step = Math.min(2, 70 - currentSubPercent);
                        currentSubPercent += step;
                        this.progressAdvance(step, 'installing dependencies (this may take a few minutes)...');
                    }
                }, 1500);

                try {
                    await installPromise;
                } finally {
                    clearInterval(progressInterval);
                }
            }

            this.progressFinish('Project created successfully!');

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
            this.progressFinish('Project setup failed');
            this.writeln('');
            this.error(`Failed to create project: ${error.message}`);
        }
    }

    private async installDependencies(targetDir: string, silent: boolean = false): Promise<void> {
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
                stdio: silent ? 'pipe' : 'inherit',
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
