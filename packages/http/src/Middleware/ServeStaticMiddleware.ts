import { Request } from '../Request';
import { Response } from '../Response';
import serveStatic from 'serve-static';

export class ServeStaticMiddleware {
    private serve: ReturnType<typeof serveStatic>;

    constructor(publicPath: string) {
        this.serve = serveStatic(publicPath, {
            index: false,
            fallthrough: true,       
        });
    }

    public handle(request: Request, next: (req: Request) => Promise<Response> | Response, response: Response): Promise<Response> | Response {
        const path = request.path();

        // Fast-path: Skip filesystem check for paths that likely aren't assets (no dots)
        if (path === '/' || path.indexOf('.') === -1) {
            return next(request);
        }

        return new Promise((resolve, reject) => {
            const req = request.getIncomingMessage();
            const res = response.getOriginalResponse();

            this.serve(req as any, res as any, (err: any) => {
                if (err) return reject(err);
                
                const result = next(request);
                if (result instanceof Promise) {
                    result.then(resolve).catch(reject);
                } else {
                    resolve(result);
                }
            });
        });
    }
}
