
import { Command } from '@arikajs/console';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export class ServeCommand extends Command {
    public signature = 'serve {--port=3000} {--host=localhost} {--dev}';
    public description = 'Serve the application on the development server';

    private log(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
        console.log(`[${timestamp}] ${level}: ${message}`);
    }

    public async handle() {
        const root = process.cwd();
        const pkgPath = path.join(root, 'package.json');
        const port = this.option('port') as string;
        const host = this.option('host') as string;

        if (!fs.existsSync(pkgPath)) {
            this.error('No package.json found. Make sure you are in an ArikaJS project root.');
            return;
        }

        const isTypeScript = fs.existsSync(path.join(root, 'tsconfig.json'));
        const serverFile = isTypeScript ? 'server.ts' : 'server.js';

        if (!fs.existsSync(path.join(root, serverFile))) {
            this.error(`Could not find ${serverFile} in the current directory.`);
            return;
        }

        this.writeln('');
        this.info(' ArikaJS Development Server');
        this.comment(` Local: http://${host}:${port}`);
        this.writeln('');

        const command = isTypeScript ? 'npx' : 'node';
        const args = isTypeScript ? ['--yes', 'tsx', 'watch', serverFile] : [serverFile];

        let watcher: fs.FSWatcher | null = null;
        let server: ReturnType<typeof spawn> | null = null;
        let isExiting = false;
        let isRestarting = false;

        const startServer = () => {
            if (isExiting) return;

            server = spawn(command, args, {
                cwd: root,
                stdio: 'inherit',
                shell: process.platform === 'win32',
                env: { ...process.env, PORT: port, HOST: host, PROJECT_ROOT: root }
            });

            server.on('close', (code: number | null) => {
                server = null;
                if (!isExiting && !isRestarting && code !== 0 && code !== null) {
                    this.error(`Server exited with code ${code}`);
                }
            });
        };

        const stopServer = async (): Promise<void> => {
            if (!server) return;
            return new Promise((resolve) => {
                const currentServer = server!;
                let resolved = false;

                currentServer.once('close', () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                });

                try {
                    currentServer.kill('SIGTERM');
                    setTimeout(() => {
                        if (!resolved) {
                            try { currentServer.kill('SIGKILL'); } catch (e) { }
                            resolved = true;
                            resolve();
                        }
                    }, 1000);
                } catch (e) {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }
            });
        };

        const cleanup = async () => {
            if (isExiting) return;
            isExiting = true;
            if (watcher) watcher.close();
            await stopServer();
        };

        if (isTypeScript) {
            this.comment(' [System] Hot-reloading enabled (watching code, config & resources)');

            const watchExtensions = ['.ts', '.js', '.json', '.ark.html', '.env'];
            const ignoreDirs = ['node_modules', '.git', 'dist', 'storage'];

            watcher = fs.watch(root, { recursive: true }, async (event, filename) => {
                if (!filename || isRestarting || isExiting) return;

                const ext = path.extname(filename);
                const isWatchedFile = watchExtensions.includes(ext) || path.basename(filename) === '.env';
                const isIgnored = ignoreDirs.some(dir =>
                    filename.startsWith(dir + path.sep) || filename === dir
                );

                if (isWatchedFile && !isIgnored) {
                    isRestarting = true;

                    this.log('INFO', `File changed: ${filename}`);

                    setTimeout(async () => {
                        this.log('INFO', 'Restarting server...');
                        await stopServer();

                        // Small delay for OS port release
                        setTimeout(() => {
                            startServer();
                            setTimeout(() => {
                                this.log('INFO', 'Server restarted successfully.');
                                isRestarting = false;
                            }, 500);
                        }, 300);
                    }, 600);
                }
            });
        }

        // Initial start
        startServer();

        return new Promise<void>((resolve) => {
            const signalHandler = async () => {
                await cleanup();
                resolve();
            };

            process.once('SIGINT', signalHandler);
            process.once('SIGTERM', signalHandler);
        });
    }
}
