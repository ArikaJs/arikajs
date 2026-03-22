import { Request } from '../Request';
import { Response } from '../Response';
import { Middleware } from '../Middleware';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

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
                const { body, files } = await this.parseBody(request);
                request.setBody(body);
                request.setFiles(files);
            } catch (error) {
                // If parsing fails, we'll just continue with empty body
            }
        }

        return next(request);
    }

    /**
     * Parse the raw request stream.
     */
    private parseBody(request: Request): Promise<{ body: any; files: any }> {
        return new Promise((resolve, reject) => {
            const contentType = request.header('content-type') as string | undefined;
            const req = request.getRaw();

            if (contentType?.includes('multipart/form-data')) {
                try {
                    const Busboy = require('busboy');
                    const busboy = Busboy({ headers: request.headers() });
                    const body: Record<string, any> = {};
                    const files: Record<string, any> = {};

                    busboy.on('field', (name: string, value: any) => {
                        body[name] = value;
                    });

                    busboy.on('file', (name: string, file: any, info: any) => {
                        const { filename, encoding, mimeType } = info;
                        const tmpPath = path.join(os.tmpdir(), `arikajs_${Date.now()}_${filename}`);
                        const writeStream = fs.createWriteStream(tmpPath);
                        file.pipe(writeStream);

                        files[name] = {
                            name,
                            filename,
                            tmpPath,
                            encoding,
                            mimeType
                        };
                    });

                    busboy.on('close', () => {
                        resolve({ body, files });
                    });

                    busboy.on('finish', () => {
                        resolve({ body, files });
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

            let rawBody = '';
            req.on('data', (chunk: Buffer) => {
                rawBody += chunk.toString();
            });

            req.on('end', () => {
                let parsedBody = {};
                if (contentType?.includes('application/json')) {
                    try {
                        parsedBody = JSON.parse(rawBody || '{}');
                    } catch (e) {
                        reject(new Error('Invalid JSON'));
                        return;
                    }
                } else if (contentType?.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(rawBody);
                    const data: Record<string, any> = {};
                    params.forEach((value, key) => {
                        data[key] = value;
                    });
                    parsedBody = data;
                }
                
                resolve({ body: parsedBody, files: {} });
            });

            req.on('error', (err: Error) => {
                reject(err);
            });
        });
    }
}
