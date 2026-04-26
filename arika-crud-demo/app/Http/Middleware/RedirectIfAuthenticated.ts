import { Request, Response } from 'arikajs';

export class RedirectIfAuthenticated {
    /**
     * Handle an incoming request.
     */
    public async handle(request: Request, next: (request: Request) => Promise<Response>, ...guards: string[]): Promise<Response> {
        const authGuards = guards.length > 0 ? guards : [undefined];

        for (const guard of authGuards) {
            if (await request.auth.guard(guard).check()) {
                return (request as any).res.redirect('/dashboard');
            }
        }

        return await next(request);
    }
}
