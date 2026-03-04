
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export class KeyGenerateCommand extends Command {
    public signature = 'key:generate';
    public description = 'Set the application key';

    public async handle() {
        const envPath = path.join(process.cwd(), '.env');

        if (!fs.existsSync(envPath)) {
            this.error('.env file not found.');
            return;
        }

        const key = this.generateRandomKey();

        if (this.setKeyInEnvironmentFile(envPath, key)) {
            this.info('Application key set successfully.');
        }
    }

    private generateRandomKey(): string {
        return 'base64:' + randomBytes(32).toString('base64');
    }

    private setKeyInEnvironmentFile(path: string, key: string): boolean {
        let content = fs.readFileSync(path, 'utf8');

        if (content.includes('APP_KEY=')) {
            content = content.replace(/APP_KEY=.*/, `APP_KEY=${key}`);
        } else {
            content += `\nAPP_KEY=${key}\n`;
        }

        fs.writeFileSync(path, content);
        return true;
    }
}
