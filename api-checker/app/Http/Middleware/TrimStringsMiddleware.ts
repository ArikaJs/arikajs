import { Request, Response } from 'arikajs';

/**
 * TrimStrings middleware.
 * Automatically trims whitespace from all string input fields.
 */
export class TrimStringsMiddleware {
    protected except: string[] = ['password', 'password_confirmation', 'current_password'];

    public async handle(req: Request, next: (req: Request) => Promise<Response>, res?: Response): Promise<Response> {
        const data = (req as any).body ?? {};

        for (const key of Object.keys(data)) {
            if (!this.except.includes(key) && typeof data[key] === 'string') {
                data[key] = data[key].trim();
            }
        }

        return next(req);
    }
}
