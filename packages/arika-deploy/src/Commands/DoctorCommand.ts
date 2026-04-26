
import { execSync } from 'child_process';
import type { ICommand } from '../CommandRegistry';

interface CheckResult {
    label: string;
    ok: boolean;
    fix?: string;
}

function check(label: string, fn: () => boolean, fix?: string): CheckResult {
    try {
        return { label, ok: fn(), fix };
    } catch {
        return { label, ok: false, fix };
    }
}

function isInstalled(cmd: string): boolean {
    try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function nodeVersion(): boolean {
    const version = process.versions.node.split('.')[0];
    return parseInt(version, 10) >= 16;
}

export class DoctorCommand implements ICommand {
    public name = 'doctor';
    public description = 'Check environment health for deployment';

    public async handle(_args: string[], _flags: Record<string, string | boolean>): Promise<void> {
        console.log('');
        console.log('\x1b[35m🩺 Arika Deploy — Doctor\x1b[0m');
        console.log('\x1b[90m─────────────────────────────────\x1b[0m');
        console.log('');

        const checks: CheckResult[] = [
            check('Node.js installed (>=16)', () => isInstalled('node') && nodeVersion(),
                'Install Node.js >= 16 from https://nodejs.org'),
            check('npm installed', () => isInstalled('npm'),
                'Install npm: https://www.npmjs.com/get-npm'),
            check('PM2 installed', () => isInstalled('pm2'),
                'Run: npm install -g pm2'),
            check('Nginx installed', () => isInstalled('nginx'),
                'Run: sudo apt install nginx'),
            check('Apache installed', () => isInstalled('apache2') || isInstalled('httpd'),
                'Run: sudo apt install apache2'),
            check('Certbot (SSL) installed', () => isInstalled('certbot'),
                'Run: sudo apt install certbot python3-certbot-nginx'),
            check('Git installed', () => isInstalled('git'),
                'Run: sudo apt install git'),
        ];

        let hasError = false;

        for (const result of checks) {
            if (result.ok) {
                console.log(`  \x1b[32m✅ ${result.label}\x1b[0m`);
            } else {
                hasError = true;
                console.log(`  \x1b[31m❌ ${result.label}\x1b[0m`);
                if (result.fix) {
                    console.log(`     \x1b[33m👉 ${result.fix}\x1b[0m`);
                }
            }
        }

        console.log('');
        console.log('\x1b[90m─────────────────────────────────\x1b[0m');

        if (hasError) {
            console.log('\x1b[33m⚠ Some checks failed. Fix the issues above and run "arika-deploy doctor" again.\x1b[0m');
        } else {
            console.log('\x1b[32m✅ All checks passed! Your environment is ready for deployment.\x1b[0m');
        }

        console.log('');
    }
}
