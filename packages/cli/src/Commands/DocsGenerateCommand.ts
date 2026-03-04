import { Command } from '@arikajs/console';
import { RouteParser, DocumentationGenerator } from '@arikajs/docs';
import path from 'path';
import fs from 'fs';

export class DocsGenerateCommand extends Command {
    public signature = 'docs:generate {--prefix=} {--base-url=} {--route-file=}';
    public description = 'Generate API documentation, Postman collection, and OpenAPI spec';

    public async handle() {
        const appDir = process.cwd();
        const outputDir = path.join(appDir, 'docs');
        const prefixFilter = this.option('prefix');
        const baseUrlOption = this.option('base-url');
        const routeFileOption = this.option('route-file');

        try {
            let routes: any[] = [];

            await this.task('Extracting route information', async () => {
                const parser = new RouteParser();
                routes = parser.parseApplicationRoutes(appDir, routeFileOption as string | null);
            });

            if (routes.length === 0) {
                this.writeln('');
                this.writeln('  ⚠  No routes found. Make sure your route files are in the routes/ directory.');
                this.writeln('');
                return;
            }

            const configData = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
            const appName = configData.name || 'ArikaJS App';

            // Resolve base URL
            let baseUrl = baseUrlOption as string | undefined;
            if (!baseUrl) {
                const envPath = path.join(appDir, '.env');
                if (fs.existsSync(envPath)) {
                    const env = fs.readFileSync(envPath, 'utf8');
                    const appUrlMatch = env.match(/^APP_URL\s*=\s*(.+)$/m);
                    const portMatch = env.match(/^PORT\s*=\s*(.+)$/m);
                    baseUrl = appUrlMatch ? appUrlMatch[1].trim() : `http://localhost:${portMatch ? portMatch[1].trim() : '3000'}`;
                } else {
                    baseUrl = 'http://localhost:3000';
                }
            }

            if (prefixFilter) {
                baseUrl = `${baseUrl.replace(/\/$/, '')}/${(prefixFilter as string).replace(/^\//, '')}`;
            }

            // Filter routes by prefix if requested
            let filteredRoutes = routes;
            if (prefixFilter) {
                filteredRoutes = routes.filter(r =>
                    r.path.startsWith(prefixFilter as string) ||
                    r.prefix?.startsWith(prefixFilter as string)
                );
            }

            await this.task(`Generating documentation in: ${outputDir}`, async () => {
                const generator = new DocumentationGenerator();
                generator.generateAll(filteredRoutes, appName, outputDir, { baseUrl });

                // Copy assets
                const templateAssetPath = path.join(__dirname, '..', '..', 'templates', 'app', 'public', 'assets', 'img');
                const outputAssetPath = path.join(outputDir, 'assets', 'img');
                if (fs.existsSync(templateAssetPath)) {
                    if (!fs.existsSync(outputAssetPath)) {
                        fs.mkdirSync(outputAssetPath, { recursive: true });
                    }
                    ['logo.png', 'favicon.png'].forEach(file => {
                        const src = path.join(templateAssetPath, file);
                        const dest = path.join(outputAssetPath, file);
                        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
                    });
                }
            });

            this.writeln('');
            this.success(`✔ Documentation generated successfully (${filteredRoutes.length} routes found):`);
            this.writeln(`  - docs/api_docs.html (Arika-themed HTML)`);
            this.writeln(`  - docs/DOCS.md (Markdown)`);
            this.writeln(`  - docs/postman_collection.json (Postman)`);
            this.writeln(`  - docs/openapi.json (OpenAPI 3.0)`);
            this.writeln(`  - docs/postman_environment.json (Environment)`);

        } catch (error: any) {
            this.error('Failed to generate documentation.');
            this.error(error.message);
        }
    }
}
