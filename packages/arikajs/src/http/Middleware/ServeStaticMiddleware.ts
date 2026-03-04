import { Request, Response } from '@arikajs/http';
import serveStatic from 'serve-static';
import path from 'path';

export class ServeStaticMiddleware {
    private serve: ReturnType<typeof serveStatic>;

    constructor(publicPath: string = path.join(process.cwd(), 'public')) {
        this.serve = serveStatic(publicPath, {
            index: false,
            fallthrough: true,
        });
    }

    public async handle(request: Request, next: (req: Request) => Promise<Response>, response: Response): Promise<Response> {
        return new Promise((resolve, reject) => {
            const req = request.getIncomingMessage();
            const res = response.getOriginalResponse();

            this.serve(req as any, res as any, async (err: any) => {
                if (err) {
                    return reject(err);
                }

                try {
                    const result = await next(request);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
