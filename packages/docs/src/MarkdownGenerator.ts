import { ParsedRoute } from './types';

export class MarkdownGenerator {
    public generate(routes: ParsedRoute[], appName: string, baseUrl?: string): string {
        let markdown = `# API Documentation: ${appName}\n\n`;
        markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;
        markdown += `> **Total Routes:** ${routes.length}\n\n`;

        const groups = this.groupByPrefix(routes);

        for (const [group, groupRoutes] of Object.entries(groups)) {
            markdown += `## ${group}\n\n`;
            markdown += `| Method | Path | Handler | Name | Middleware |\n`;
            markdown += `| :--- | :--- | :--- | :--- | :--- |\n`;

            groupRoutes.forEach(route => {
                const middleware = route.middleware.length > 0 ? route.middleware.join(', ') : '-';
                const handler = route.handler || '-';
                const name = route.name || '-';
                markdown += `| **${route.method}** | \`${route.path}\` | ${handler} | ${name} | ${middleware} |\n`;
            });

            markdown += `\n`;
        }

        return markdown;
    }

    private groupByPrefix(routes: ParsedRoute[]): Record<string, ParsedRoute[]> {
        const groups: Record<string, ParsedRoute[]> = {};
        routes.forEach(r => {
            let group = r.prefix ? r.prefix.replace(/^\/+/, '').split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') : 'General';
            if (!group) group = 'General';
            if (!groups[group]) groups[group] = [];
            groups[group].push(r);
        });
        return groups;
    }
}
