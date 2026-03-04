import fs from 'fs';
import path from 'path';

export class RouteParser {
    public parseApplicationRoutes(appDir: string, routeFileName: string | null = null): any[] {
        const routesDir = path.join(appDir, 'routes');
        if (!fs.existsSync(routesDir)) return [];

        const routes: any[] = [];
        let filesToParse: string[] = [];

        if (routeFileName) {
            const specificFile = path.join(routesDir, routeFileName.endsWith('.ts') ? routeFileName : `${routeFileName}.ts`);
            if (fs.existsSync(specificFile)) {
                filesToParse = [specificFile];
            } else {
                console.warn(`\n  ⚠ Route file not found: ${specificFile}\n`);
                return [];
            }
        } else {
            const allFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
            if (allFiles.includes('api.ts')) {
                filesToParse = [path.join(routesDir, 'api.ts')];
            } else if (allFiles.length > 0) {
                filesToParse = [path.join(routesDir, allFiles[0])];
            }
        }

        for (const file of filesToParse) {
            const content = fs.readFileSync(file, 'utf8');
            this.extractRoutesFromContent(content, routes);
        }

        return routes;
    }

    private extractRoutesFromContent(content: string, routes: any[]): void {
        const strippedContent = this.extractGroupRoutes(content, routes);
        this.extractFlatRoutes(strippedContent, routes, '', []);
    }

    private extractGroupRoutes(content: string, routes: any[]): string {
        const groupRegex = /Route\.group\s*\(\s*\{([^}]+)\}\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g;
        let match: RegExpExecArray | null;

        let contentCopy = content;
        while ((match = groupRegex.exec(content)) !== null) {
            const groupConfig = match[1];
            const groupBody = match[2];

            let prefix = '';
            let middleware: string[] = [];

            const prefixMatch = groupConfig.match(/prefix\s*:\s*['"`]([^'"`]+)['"`]/);
            if (prefixMatch) prefix = prefixMatch[1];

            const mwMatch = groupConfig.match(/middleware\s*:\s*(['"`][^'"`]+['"`]|\[[^\]]+\])/);
            if (mwMatch) {
                const mwStr = mwMatch[1];
                if (mwStr.startsWith('[')) {
                    const mws = mwStr.match(/['"`]([^'"`]+)['"`]/g);
                    if (mws) middleware = mws.map(m => m.replace(/['"`]/g, ''));
                } else {
                    middleware.push(mwStr.replace(/['"`]/g, ''));
                }
            }

            this.extractFlatRoutes(groupBody, routes, prefix, middleware);
        }

        return this.stripGroupBlocks(contentCopy);
    }

    private stripGroupBlocks(content: string): string {
        let result = content;
        let changed = true;

        while (changed) {
            changed = false;
            const groupStart = result.indexOf('Route.group(');
            if (groupStart === -1) break;

            const arrowIdx = result.indexOf('=>', groupStart);
            if (arrowIdx === -1) break;
            const braceStart = result.indexOf('{', arrowIdx);
            if (braceStart === -1) break;

            let depth = 0;
            let i = braceStart;
            for (; i < result.length; i++) {
                if (result[i] === '{') depth++;
                else if (result[i] === '}') {
                    depth--;
                    if (depth === 0) break;
                }
            }

            let endIdx = result.indexOf(';', i);
            if (endIdx === -1) endIdx = i + 1;

            result = result.substring(0, groupStart) + result.substring(endIdx + 1);
            changed = true;
        }

        return result;
    }

    private extractFlatRoutes(content: string, routes: any[], prefix: string, middleware: string[]): void {
        const normalized = content.replace(/\s+/g, ' ');
        const routeRegex = /Route\.(get|post|put|patch|delete|options)\s*\(\s*['"`]([^'"`]*)['"`]\s*,\s*((?:[^\(\)]*|\([^\)]*\))*)\)\s*([^;]*)?;?/g;

        let match: RegExpExecArray | null;
        while ((match = routeRegex.exec(normalized)) !== null) {
            const method = match[1].toUpperCase();
            const routePath = match[2];
            const handlerStr = match[3]?.trim() || '';
            const modifiersStr = match[4] || '';

            const controllerMatch = handlerStr.match(/\[\s*(\w+)\s*,\s*['"`](\w+)['"`]\s*\]/);
            const instanceMatch = handlerStr.match(/(\w+)\.(\w+)/);
            let handlerLabel: string;
            if (controllerMatch) {
                handlerLabel = `${controllerMatch[1]}@${controllerMatch[2]}`;
            } else if (instanceMatch && !handlerStr.includes('=>')) {
                handlerLabel = `${instanceMatch[1]}.${instanceMatch[2]}`;
            } else if (handlerStr.includes('=>')) {
                handlerLabel = '[Closure]';
            } else {
                handlerLabel = handlerStr.substring(0, 40);
            }

            const routeMiddleware = [...middleware];
            const withMwRegex = /\.withMiddleware\s*\(\s*(['"`][^'"`]+['"`]|\[[^\]]+\])\s*\)/;
            const withMwMatch = modifiersStr.match(withMwRegex);
            if (withMwMatch) {
                const mwStr = withMwMatch[1];
                if (mwStr.startsWith('[')) {
                    const mws = mwStr.match(/['"`]([^'"`]+)['"`]/g);
                    if (mws) routeMiddleware.push(...mws.map(m => m.replace(/['"`]/g, '')));
                } else {
                    routeMiddleware.push(mwStr.replace(/['"`]/g, ''));
                }
            }

            let name: string | undefined;
            const asRegex = /\.as\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/;
            const asMatch = modifiersStr.match(asRegex);
            if (asMatch) name = asMatch[1];

            const fullPath = this.joinPaths(prefix, routePath);
            const paramKeys = this.extractParamKeys(fullPath);

            routes.push({
                method,
                path: fullPath,
                handler: handlerLabel !== '[Closure]' && handlerLabel.length > 0 ? handlerLabel : undefined,
                name,
                middleware: routeMiddleware,
                prefix,
                paramKeys
            });
        }
    }

    private joinPaths(prefix: string, path: string): string {
        const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');
        const cleanPath = path.replace(/^\/+|\/+$/g, '');
        const sep = cleanPrefix && cleanPath ? '/' : '';
        return `/${cleanPrefix}${sep}${cleanPath}`;
    }

    private extractParamKeys(pathStr: string): string[] {
        const keys: string[] = [];
        const regex = /:([a-zA-Z0-9_]+)|\{([a-zA-Z0-9_]+)\}/g;
        let match;
        while ((match = regex.exec(pathStr)) !== null) {
            keys.push(match[1] || match[2]);
        }
        return keys;
    }
}
