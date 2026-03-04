import { Request } from '../Request';
import { Response } from '../Response';
import { Middleware } from '../Middleware';

export class BodyParserMiddleware implements Middleware {
    /**
     * Handle the incoming request.
     */
    async handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response,
        response?: Response
    ): Promise<Response> {
        const method = request.method();
        const contentType = request.header('content-type') as string | undefined;

        // Only parse for methods that can have a body
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && contentType) {
            try {
                const body = await this.parseBody(request);
                request.setBody(body);
            } catch (error) {
                // If parsing fails, we'll just continue with empty body
            }
        }

        return next(request);
    }

    /**
     * Parse the raw request stream.
     */
    private parseBody(request: Request): Promise<any> {
        return new Promise((resolve, reject) => {
            const contentType = request.header('content-type') as string | undefined;
            const req = request.getRaw();

            if (contentType?.includes('multipart/form-data')) {
                try {
                    const Busboy = require('busboy');
                    const busboy = Busboy({ headers: request.headers() });
                    const data: Record<string, any> = {};

                    busboy.on('field', (name: string, value: any, info: any) => {
                        data[name] = value;
                    });

                    busboy.on('file', (name: string, file: any, info: any) => {
                        // For now we just consume the file stream to prevent hang
                        file.resume();
                    });

                    busboy.on('close', () => {
                        resolve(data);
                    });

                    busboy.on('finish', () => {
                        resolve(data);
                    });

                    busboy.on('error', (err: Error) => {
                        reject(err);
                    });

                    req.pipe(busboy);
                } catch (e) {
                    reject(e);
                }
                return;
            }

            let body = '';
            req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                if (contentType?.includes('application/json')) {
                    try {
                        resolve(JSON.parse(body || '{}'));
                    } catch (e) {
                        reject(new Error('Invalid JSON'));
                    }
                } else if (contentType?.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(body);
                    const data: Record<string, any> = {};
                    params.forEach((value, key) => {
                        data[key] = value;
                    });
                    resolve(data);
                } else {
                    resolve({});
                }
            });

            req.on('error', (err: Error) => {
                reject(err);
            });
        });
    }
}
