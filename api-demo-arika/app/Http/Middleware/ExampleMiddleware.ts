import { Request, Response } from 'arikajs';

export class ExampleMiddleware {
    /**
     * Handle an incoming request.
     */
    public async handle(request: Request, next: (req: Request) => Promise<Response>): Promise<Response> {
        // Perform some action...

        return await next(request);
    }
}
