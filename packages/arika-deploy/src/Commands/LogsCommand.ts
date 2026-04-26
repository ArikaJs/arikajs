
import { spawnSync } from 'child_process';
import type { ICommand } from '../CommandRegistry';

export class LogsCommand implements ICommand {
    public name = 'logs';
    public description = 'View live app logs';

    public async handle(_args: string[], flags: Record<string, string | boolean>): Promise<void> {
        const appName = this.getAppName();
        const args = ['logs', appName];

        if (flags['error']) {
            args.push('--err');
        }

        if (flags['lines']) {
            args.push('--lines', String(flags['lines']));
        }

        spawnSync('pm2', args, { stdio: 'inherit', shell: true });
    }

    private getAppName(): string {
        const fs = require('fs');
        const path = require('path');
        const configFile = path.join('.arika', 'config.json');
        if (fs.existsSync(configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                return config.name || 'all';
            } catch { }
        }
        return 'all';
    }
}
