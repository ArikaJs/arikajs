import { Middleware } from '../Middleware';
import { Request } from '../Request';
import { Response } from '../Response';

/**
 * Convert empty strings to null middleware.
 * Automatically converts empty string inputs in the request body to null.
 */
export class ConvertEmptyStringsToNull implements Middleware {
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
            if (data[key] === '') {
                data[key] = null;
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                this.clean(data[key]);
            }
        }
    }
}
