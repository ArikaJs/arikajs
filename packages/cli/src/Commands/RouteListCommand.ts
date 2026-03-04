import { Command } from '@arikajs/console';
import path from 'path';
import fs from 'fs';

export class RouteListCommand extends Command {
    public signature = 'route:list';
    public description = 'List all registered routes';

    public async handle() {
        const cwd = process.cwd();

        // Dynamically load the user's app Router/RouteRegistry.
        // We do this by importing their routes directly.
        // Arika standard apps have routes in: routes/web.ts and routes/api.ts
        const webRoutes = path.join(cwd, 'routes', 'web.ts');
        const apiRoutes = path.join(cwd, 'routes', 'api.ts');

        try {
            if (fs.existsSync(webRoutes)) {
                await import(webRoutes);
            }
            if (fs.existsSync(apiRoutes)) {
                await import(apiRoutes);
            }
        } catch (e: any) {
            this.error('Could not load application routes. Make sure you are running this command from the root of an ArikaJS application.');
            this.error(e.message);
            return;
        }

        // Now that the routes are imported, the RouteRegistry will have them.
        // But the CLI needs to import Router from the user's project to get the exact instance,
        // or since it's a singleton, we can grab it if it's installed locally.
        try {
            const { RouteRegistry } = await import(path.join(cwd, 'node_modules', '@arikajs', 'router'));
            const routes = RouteRegistry.getInstance().getRoutes();

            if (!routes || routes.length === 0) {
                this.info('No routes found.');
                return;
            }

            const tableData = routes.map((r: any) => {
                const methodStr = typeof r.method === 'string' ? r.method : r.method.join('|');

                let action = 'Closure';
                if (Array.isArray(r.handler) && r.handler.length === 2) {
                    action = `${r.handler[0].name || 'Controller'}@${r.handler[1]}`;
                } else if (r.handler && typeof r.handler === 'object' && r.handler.action) {
                    action = r.handler.action.name || 'Closure';
                } else if (typeof r.handler === 'function' && r.handler.name) {
                    action = r.handler.name;
                }

                return [
                    methodStr.toUpperCase(),
                    r.path,
                    r.name || '',
                    action,
                    r.middleware && r.middleware.length ? r.middleware.map((m: any) => m.name || 'Middleware').join(', ') : ''
                ];
            });

            this.table(
                ['Method', 'URI', 'Name', 'Action', 'Middleware'],
                tableData
            );
            this.success(`\nFound ${routes.length} total routes.`);
        } catch (e: any) {
            this.error('Could not resolve @arikajs/router. Are you in an ArikaJS project?');
        }
    }
}
