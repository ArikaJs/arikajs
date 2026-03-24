
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class SocialiteInstallCommand extends Command {
    public signature = 'socialite:install {--force}';
    public description = 'Install and configure @arikajs/socialite for the application';

    public async handle() {
        const cwd = process.cwd();
        const force = this.option('force');

        this.writeln('');
        this.info(' 🍱 ArikaJS Socialite Installation');
        this.writeln('');

        // 1. Verify existence of package or at least workspace
        // (In a real app, we check node_modules/@arikajs/socialite)
        
        // 2. Publish Configuration
        const configDir = path.join(cwd, 'config');
        const targetConfig = path.join(configDir, 'socialite.ts');
        
        // Template source (In production this comes from __dirname)
        // For now I'll use a hardcoded stub to ensure reliability
        const configStub = this.getConfigStub();

        await this.task('Creating configuration file', async () => {
            if (fs.existsSync(targetConfig) && !force) {
                throw new Error('Configuration file [config/socialite.ts] already exists. Use --force to overwrite.');
            }

            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(targetConfig, configStub);
        });

        const envPath = path.join(cwd, '.env');
        if (fs.existsSync(envPath)) {
            await this.task('Updating environment variables', async () => {
                let envContent = fs.readFileSync(envPath, 'utf8');
                
                if (!envContent.includes('GOOGLE_CLIENT_ID')) {
                    const socialiteEnv = this.getEnvStub();
                    fs.appendFileSync(envPath, socialiteEnv);
                } else {
                    // Still mark as done but maybe with a comment
                }
            });
        }

        // 4. Instructions for Service Provider
        this.writeln('');
        this.info(' 💡 Next Steps:');
        this.writeln(' 1. Register the SocialiteServiceProvider in [bootstrap/app.ts]:');
        this.info('    import { SocialiteServiceProvider } from \'@arikajs/socialite\';');
        this.info('    app.register(SocialiteServiceProvider);');
        this.writeln('');
        this.writeln(' 2. Configure your provider keys in your [.env] file.');
        this.writeln('');
    }

    private getConfigStub() {
        return `
export default {
    /*
    |--------------------------------------------------------------------------
    | Socialite Providers
    |--------------------------------------------------------------------------
    |
    | Here you may configure the OAuth providers that you would like to use
    | in your application.
    |
    */

    providers: {
        google: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect: process.env.GOOGLE_REDIRECT_URI,
        },

        github: {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect: process.env.GITHUB_REDIRECT_URI,
        },

        facebook: {
            client_id: process.env.FACEBOOK_CLIENT_ID,
            client_secret: process.env.FACEBOOK_CLIENT_SECRET,
            redirect: process.env.FACEBOOK_REDIRECT_URI,
        },

        x: {
            client_id: process.env.X_CLIENT_ID,
            client_secret: process.env.X_CLIENT_SECRET,
            redirect: process.env.X_REDIRECT_URI,
        },
    },
};
`;
    }

    private getEnvStub() {
        return `
# Socialite Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=\${APP_URL}/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=\${APP_URL}/auth/github/callback

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=\${APP_URL}/auth/facebook/callback

X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=\${APP_URL}/auth/x/callback
`;
    }
}
