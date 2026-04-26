
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import type { ICommand } from '../CommandRegistry';

interface DeployConfig {
    name: string;
    domains: string[];
    port: number;
    server: 'nginx' | 'apache' | 'none';
    ssl: boolean;
    entry: string;
}

const ARIKA_DIR = '.arika';
const CONFIG_FILE = path.join(ARIKA_DIR, 'config.json');

function ask(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
}

function print(msg: string) { process.stdout.write(msg + '\n'); }
function info(msg: string) { print(`\x1b[36m${msg}\x1b[0m`); }
function success(msg: string) { print(`\x1b[32m${msg}\x1b[0m`); }
function warn(msg: string) { print(`\x1b[33m${msg}\x1b[0m`); }
function error(msg: string) { print(`\x1b[31m${msg}\x1b[0m`); }
function step(n: number, total: number, msg: string) {
    print(`\x1b[90m[${n}/${total}]\x1b[0m \x1b[37m${msg}\x1b[0m`);
}

function isInstalled(cmd: string): boolean {
    try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function detectWebServer(): 'nginx' | 'apache' | 'none' {
    if (isInstalled('nginx')) return 'nginx';
    if (isInstalled('apache2') || isInstalled('httpd')) return 'apache';
    return 'none';
}

function loadConfig(): DeployConfig | null {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function saveConfig(config: DeployConfig): void {
    if (!fs.existsSync(ARIKA_DIR)) fs.mkdirSync(ARIKA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function detectPort(): number {
    if (fs.existsSync('.env')) {
        const env = fs.readFileSync('.env', 'utf8');
        const match = env.match(/^PORT\s*=\s*(\d+)/m);
        if (match) return parseInt(match[1], 10);
    }
    return 3000;
}

function detectEntry(): string {
    const candidates = ['app.js', 'server.js', 'index.js', 'app.ts', 'server.ts', 'index.ts'];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return 'server.js';
}

function detectAppName(): string {
    if (fs.existsSync('package.json')) {
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (pkg.name) return pkg.name;
        } catch { }
    }
    return path.basename(process.cwd());
}

function installPM2(): void {
    print('  Installing PM2...');
    execSync('npm install -g pm2', { stdio: 'inherit' });
}

function startWithPM2(config: DeployConfig): void {
    const args = [
        'start', config.entry,
        '--name', config.name,
        '-i', 'max',
        '--no-autorestart', // we use restart-on-crash via watch
    ];
    spawnSync('pm2', args, { stdio: 'inherit', shell: true });
    execSync('pm2 save', { stdio: 'ignore' });
}

function writeNginxConfig(config: DeployConfig): void {
    const serverNames = config.domains.join(' ');
    const nginxConf = `server {
    listen 80;
    server_name ${serverNames};

    location / {
        proxy_pass http://localhost:${config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    const confPath = `/etc/nginx/sites-available/${config.name}`;
    const enabledPath = `/etc/nginx/sites-enabled/${config.name}`;

    try {
        fs.writeFileSync(confPath, nginxConf);
        if (!fs.existsSync(enabledPath)) {
            execSync(`ln -s ${confPath} ${enabledPath}`);
        }
        execSync('nginx -t', { stdio: 'ignore' });
        execSync('systemctl reload nginx', { stdio: 'ignore' });
    } catch {
        warn('  ⚠ Could not write Nginx config (try with sudo).');
    }
}

function writeApacheConfig(config: DeployConfig): void {
    const serverName = config.domains[0];
    const apacheConf = `<VirtualHost *:80>
    ServerName ${serverName}
    ${config.domains.slice(1).map(d => `ServerAlias ${d}`).join('\n    ')}

    ProxyRequests Off
    ProxyPass / http://localhost:${config.port}/
    ProxyPassReverse / http://localhost:${config.port}/
</VirtualHost>
`;
    const confPath = `/etc/apache2/sites-available/${config.name}.conf`;

    try {
        fs.writeFileSync(confPath, apacheConf);
        execSync(`a2ensite ${config.name}.conf`, { stdio: 'ignore' });
        execSync('systemctl reload apache2', { stdio: 'ignore' });
    } catch {
        warn('  ⚠ Could not write Apache config (try with sudo).');
    }
}

function setupSSL(config: DeployConfig): void {
    if (!isInstalled('certbot')) {
        warn('  Certbot not found. Installing...');
        try {
            execSync('apt-get install -y certbot python3-certbot-nginx', { stdio: 'ignore' });
        } catch {
            error('  ❌ Could not install certbot. Install manually: sudo apt install certbot');
            return;
        }
    }

    const domains = config.domains.map(d => `-d ${d}`).join(' ');
    try {
        execSync(`certbot --nginx ${domains} --non-interactive --agree-tos --email admin@${config.domains[0]} --redirect`, {
            stdio: 'inherit'
        });
    } catch {
        error(`  ❌ SSL setup failed. Ensure DNS A record for ${config.domains[0]} points to this server.`);
        info(`  👉 Fix DNS A record, then run: sudo certbot --nginx ${domains}`);
    }
}

export class DeployCommand implements ICommand {
    public name = 'deploy';
    public description = 'Deploy the Node.js app (PM2 + Nginx/Apache + SSL)';

    public async handle(_args: string[], flags: Record<string, string | boolean>): Promise<void> {
        print('');
        print('\x1b[35m🚀 Arika Deploy\x1b[0m');
        print('\x1b[90m─────────────────────────────────\x1b[0m');

        const yes = flags['yes'] === true;
        let config = loadConfig();

        if (config && yes) {
            info('  ✔ Using saved config from .arika/config.json');
        } else {
            // Interactive setup
            config = await this.interactiveSetup(config, flags);
            saveConfig(config);
            success('  ✔ Config saved to .arika/config.json');
        }

        print('');
        print('\x1b[90m─────────────────────────────────\x1b[0m');

        const total = config.ssl ? 5 : 4;

        // Step 1: Check environment
        step(1, total, 'Checking environment...');
        if (!fs.existsSync('package.json')) {
            error('❌ No package.json found. Run this from your project root.');
            process.exit(1);
        }
        success('  ✔ Environment OK');

        // Step 2: Install dependencies
        step(2, total, 'Installing dependencies...');
        execSync('npm install --production', { stdio: 'ignore' });
        success('  ✔ Dependencies installed');

        // Step 3: Start with PM2
        step(3, total, 'Starting app with PM2...');
        if (!isInstalled('pm2')) installPM2();
        // Stop existing if running
        spawnSync('pm2', ['stop', config.name], { stdio: 'ignore', shell: true });
        spawnSync('pm2', ['delete', config.name], { stdio: 'ignore', shell: true });
        startWithPM2(config);
        success(`  ✔ App "${config.name}" running via PM2`);

        // Step 4: Configure web server
        step(4, total, 'Configuring web server...');
        if (config.server === 'nginx') {
            if (!isInstalled('nginx')) {
                error('❌ Nginx not installed.');
                info('👉 Run: sudo apt install nginx');
                process.exit(1);
            }
            writeNginxConfig(config);
            success('  ✔ Nginx configured');
        } else if (config.server === 'apache') {
            if (!isInstalled('apache2') && !isInstalled('httpd')) {
                error('❌ Apache not installed.');
                info('👉 Run: sudo apt install apache2');
                process.exit(1);
            }
            writeApacheConfig(config);
            success('  ✔ Apache configured');
        } else {
            warn('  ⚠ No web server configured. App accessible on port ' + config.port);
        }

        // Step 5: SSL (optional)
        if (config.ssl) {
            step(5, total, 'Setting up SSL...');
            setupSSL(config);
            success('  ✔ SSL enabled');
        }

        print('');
        print('\x1b[90m─────────────────────────────────\x1b[0m');
        const proto = config.ssl ? 'https' : 'http';
        success(`✅ App running at ${proto}://${config.domains[0]}`);
        print('');
    }

    private async interactiveSetup(
        existing: DeployConfig | null,
        flags: Record<string, string | boolean>
    ): Promise<DeployConfig> {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        const defaultPort = existing?.port ?? detectPort();
        const defaultEntry = existing?.entry ?? detectEntry();
        const defaultName = existing?.name ?? detectAppName();
        const detectedServer = detectWebServer();

        print('');
        info('📋 First-time setup (answers saved for next run):');
        print('');

        const rawDomains = await ask(rl, `  Domain(s) \x1b[90m[comma separated, e.g. example.com,www.example.com]\x1b[0m: `);
        const domains = rawDomains.split(',').map(d => d.trim()).filter(Boolean);
        if (domains.length === 0) domains.push('localhost');

        const portAnswer = await ask(rl, `  App port \x1b[90m[default: ${defaultPort}]\x1b[0m: `);
        const port = parseInt(portAnswer, 10) || defaultPort;

        const entryAnswer = await ask(rl, `  Entry file \x1b[90m[default: ${defaultEntry}]\x1b[0m: `);
        const entry = entryAnswer.trim() || defaultEntry;

        // Web server
        let server: 'nginx' | 'apache' | 'none' = detectedServer;
        if (flags['nginx']) server = 'nginx';
        else if (flags['apache']) server = 'apache';
        else if (flags['no-nginx'] || flags['no-apache']) server = 'none';
        else {
            const serverLabel = detectedServer !== 'none'
                ? `auto-detected: \x1b[32m${detectedServer}\x1b[0m`
                : '\x1b[33mnone detected\x1b[0m';
            const serverAnswer = await ask(rl, `  Web server \x1b[90m[nginx/apache/none, ${serverLabel}]\x1b[0m: `);
            const trimmed = serverAnswer.trim().toLowerCase();
            if (trimmed === 'nginx' || trimmed === 'apache' || trimmed === 'none') {
                server = trimmed;
            }
        }

        // SSL
        let ssl = false;
        if (!flags['no-ssl'] && server !== 'none') {
            const sslAnswer = await ask(rl, `  Enable SSL (Let's Encrypt)? \x1b[90m[Y/n]\x1b[0m: `);
            ssl = sslAnswer.trim().toLowerCase() !== 'n';
        }

        rl.close();

        return {
            name: defaultName,
            domains,
            port,
            server,
            ssl,
            entry,
        };
    }
}
