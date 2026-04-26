
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { ICommand } from '../CommandRegistry';

function getAppName(): string {
    const configFile = path.join('.arika', 'config.json');
    if (fs.existsSync(configFile)) {
        try {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            return config.name;
        } catch { }
    }
    return '';
}

export class StopCommand implements ICommand {
    public name = 'stop';
    public description = 'Stop the deployed app';

    public async handle(_args: string[], _flags: Record<string, string | boolean>): Promise<void> {
        const name = getAppName();
        if (!name) {
            console.error('\x1b[31m❌ No deployment config found. Run "arika deploy" first.\x1b[0m');
            process.exit(1);
        }
        console.log(`\x1b[36m  Stopping "${name}"...\x1b[0m`);
        spawnSync('pm2', ['stop', name], { stdio: 'inherit', shell: true });
        console.log(`\x1b[32m  ✔ App stopped.\x1b[0m`);
    }
}
