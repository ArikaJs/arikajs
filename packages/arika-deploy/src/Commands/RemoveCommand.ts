
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import type { ICommand } from '../CommandRegistry';

function getConfig(): { name: string; server: string } | null {
    const configFile = path.join('.arika', 'config.json');
    if (fs.existsSync(configFile)) {
        try {
            return JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch { }
    }
    return null;
}

export class RemoveCommand implements ICommand {
    public name = 'remove';
    public description = 'Remove the deployment (PM2 process + web server config)';

    public async handle(_args: string[], flags: Record<string, string | boolean>): Promise<void> {
        const config = getConfig();
        if (!config) {
            console.error('\x1b[31m❌ No deployment config found in .arika/config.json\x1b[0m');
            process.exit(1);
        }

        const { name, server } = config;

        // Confirm unless --yes flag
        if (!flags['yes']) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const answer = await new Promise<string>((resolve) =>
                rl.question(`\x1b[33m  Remove deployment for "${name}"? This cannot be undone. [y/N]: \x1b[0m`, resolve)
            );
            rl.close();
            if (answer.trim().toLowerCase() !== 'y') {
                console.log('  Cancelled.');
                return;
            }
        }

        // Stop and delete PM2 process
        console.log(`\x1b[36m  Stopping PM2 process "${name}"...\x1b[0m`);
        spawnSync('pm2', ['stop', name], { stdio: 'ignore', shell: true });
        spawnSync('pm2', ['delete', name], { stdio: 'ignore', shell: true });
        spawnSync('pm2', ['save'], { stdio: 'ignore', shell: true });
        console.log('\x1b[32m  ✔ PM2 process removed.\x1b[0m');

        // Remove nginx/apache config
        if (server === 'nginx') {
            const enabledPath = `/etc/nginx/sites-enabled/${name}`;
            const availablePath = `/etc/nginx/sites-available/${name}`;
            try {
                if (fs.existsSync(enabledPath)) fs.unlinkSync(enabledPath);
                if (fs.existsSync(availablePath)) fs.unlinkSync(availablePath);
                spawnSync('systemctl', ['reload', 'nginx'], { stdio: 'ignore', shell: true });
                console.log('\x1b[32m  ✔ Nginx config removed.\x1b[0m');
            } catch {
                console.warn('\x1b[33m  ⚠ Could not remove Nginx config (try with sudo).\x1b[0m');
            }
        } else if (server === 'apache') {
            try {
                spawnSync('a2dissite', [`${name}.conf`], { stdio: 'ignore', shell: true });
                const confPath = `/etc/apache2/sites-available/${name}.conf`;
                if (fs.existsSync(confPath)) fs.unlinkSync(confPath);
                spawnSync('systemctl', ['reload', 'apache2'], { stdio: 'ignore', shell: true });
                console.log('\x1b[32m  ✔ Apache config removed.\x1b[0m');
            } catch {
                console.warn('\x1b[33m  ⚠ Could not remove Apache config (try with sudo).\x1b[0m');
            }
        }

        // Remove .arika directory
        fs.rmSync('.arika', { recursive: true, force: true });
        console.log('\x1b[32m  ✔ .arika config removed.\x1b[0m');
        console.log('');
        console.log('\x1b[32m✅ Deployment removed successfully.\x1b[0m');
    }
}
