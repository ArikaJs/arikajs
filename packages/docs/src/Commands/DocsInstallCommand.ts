
import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class DocsInstallCommand extends Command {
    public signature = 'docs:install {--force}';
    public description = 'Install and configure @arikajs/docs for the application';

    public async handle() {
        const cwd = process.cwd();
        const force = this.option('force');

        this.writeln('');
        this.info(' 📘 ArikaJS Documentation Installation');
        this.writeln('');

        // 1. Publish Configuration
        const configDir = path.join(cwd, 'config');
        const targetConfig = path.join(configDir, 'docs.ts');
        
        const configStub = this.getConfigStub();

        if (fs.existsSync(targetConfig) && !force) {
            this.error('Configuration file [config/docs.ts] already exists.');
            this.info('Use --force to overwrite.');
            return;
        }

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        fs.writeFileSync(targetConfig, configStub);
        this.success('✔ Configuration file created at [config/docs.ts]');

        // 2. Instructions for Service Provider
        this.writeln('');
        this.info(' 💡 Next Steps:');
        this.writeln(' 1. Register the DocsServiceProvider in [bootstrap/app.ts]:');
        this.info('    import { DocsServiceProvider } from \'@arikajs/docs\';');
        this.info('    app.register(DocsServiceProvider);');
        this.writeln('');
        this.writeln(' 2. You can now generate documentation using:');
        this.info('    node arika docs:generate');
        this.writeln('');
    }

    private getConfigStub() {
        return `
export default {
    /*
    |--------------------------------------------------------------------------
    | Documentation Settings
    |--------------------------------------------------------------------------
    |
    | Here you may configure the documentation generation settings, such as
    | the title, version, and output formats.
    |
    */

    title: process.env.APP_NAME || 'ArikaJS API',
    
    version: '1.0.0',
    
    output: {
        markdown: './docs/api.md',
        postman: './docs/postman_collection.json',
        openapi: './docs/openapi.yaml',
        html: './docs/html',
    },

    // Routes to exclude from documentation
    exclude: [
        '/auth/*',
        '/horizon/*',
    ],
};
`;
    }
}
