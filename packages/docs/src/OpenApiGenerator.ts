import { ParsedRoute } from './types';

export class OpenApiGenerator {
    public generate(routes: ParsedRoute[], appName: string, baseUrl: string): any {
        const paths: Record<string, any> = {};

        routes.forEach(route => {
            const rawPath = route.path.replace(/^\/+/, '');
            const openApiPath = '/' + rawPath.replace(/:([a-zA-Z0-9_]+)|\{([a-zA-Z0-9_]+)\}/g, '{$1$2}');

            if (!paths[openApiPath]) paths[openApiPath] = {};

            const method = route.method.toLowerCase();
            const group = route.prefix ? route.prefix.replace(/^\/+/, '').split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') : 'General';
            const routeName = route.name || `${method}_${rawPath.replace(/\//g, '_')}`;

            const parameters = route.paramKeys.map(key => ({
                name: key,
                in: 'path',
                required: true,
                schema: { type: 'string' }
            }));

            const operation: any = {
                summary: routeName,
                tags: [group || 'General'],
                parameters: parameters.length > 0 ? parameters : undefined,
                responses: {
                    '200': { description: 'Successful response' },
                    '401': route.middleware.includes('auth') ? { description: 'Unauthorized' } : undefined,
                }
            };

            if (route.middleware.includes('auth')) {
                operation.security = [{ bearerAuth: [] }];
            }

            if (['post', 'put', 'patch'].includes(method)) {
                operation.requestBody = {
                    content: {
                        'application/json': {
                            schema: { type: 'object', properties: {} }
                        }
                    }
                };
            }

            paths[openApiPath][method] = operation;
        });

        const servers = [{ url: baseUrl }];

        return {
            openapi: '3.0.0',
            info: {
                title: appName,
                version: '1.0.0',
                description: `API documentation for ${appName}`
            },
            servers,
            paths,
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        };
    }
}
