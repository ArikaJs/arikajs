import { Middleware } from '../Middleware';
import { Request } from '../Request';
import { Response } from '../Response';

/**
 * Trim strings middleware.
 * Automatically trims whitespace from all string inputs in the request body.
 */
export class TrimStrings implements Middleware {
    /**
     * The names of the attributes that should not be trimmed.
     */
    protected except: string[] = [
        'password',
        'password_confirmation',
    ];

    /**
     * Handle an incoming request.
     */
    public async handle(
        request: Request,
        next: (request: Request) => Promise<Response> | Response
    ): Promise<Response> {
        const body = request.all();

        if (body && typeof body === 'object') {
            this.clean(body);
        }

        return next(request);
    }

    /**
     * Clean the given data.
     */
    protected clean(data: any): void {
        for (const key in data) {
            if (this.except.includes(key)) {
                continue;
            }

            if (typeof data[key] === 'string') {
                data[key] = data[key].trim();
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                this.clean(data[key]);
            }
        }
    }
}
