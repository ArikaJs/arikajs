import { ParsedRoute } from './types';

export class PostmanGenerator {
    public generate(routes: ParsedRoute[], appName: string, baseUrl: string): any {
        const groups = this.groupByPrefix(routes);
        const item: any[] = [];

        for (const [groupName, groupRoutes] of Object.entries(groups)) {
            const groupItem: any = {
                name: groupName,
                item: []
            };

            groupRoutes.forEach(route => {
                const requestName = route.name || `${route.method} ${route.path}`;

                // Parse params out of path
                const parts = route.path.replace(/^\/+/, '').split('/');
                const urlPath = parts.map(p => {
                    const match = p.match(/^:([a-zA-Z0-9_]+)$/) || p.match(/^\{([a-zA-Z0-9_]+)\}$/);
                    if (match) return `:${match[1]}`;
                    return p;
                });

                const variables = route.paramKeys.map(key => ({
                    key, value: `<string>`
                }));

                const req: any = {
                    name: requestName,
                    request: {
                        method: route.method,
                        header: [
                            { key: 'Accept', value: 'application/json', type: 'text' },
                            { key: 'Content-Type', value: 'application/json', type: 'text' }
                        ],
                        url: {
                            raw: `{{base_url}}/${urlPath.join('/')}`,
                            host: ['{{base_url}}'],
                            path: urlPath,
                            variable: variables.length > 0 ? variables : undefined
                        }
                    },
                    response: []
                };

                if (route.middleware.includes('auth')) {
                    req.request.auth = {
                        type: 'bearer',
                        bearer: [
                            { key: "token", value: "{{token}}", type: "string" }
                        ]
                    };
                }

                if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
                    req.request.body = {
                        mode: 'raw',
                        raw: JSON.stringify({}, null, 2),
                        options: { raw: { language: 'json' } }
                    };
                }

                groupItem.item.push(req);
            });

            item.push(groupItem);
        }

        return {
            info: {
                name: `${appName} API`,
                description: `Auto-generated API collection for ${appName}`,
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item
        };
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
