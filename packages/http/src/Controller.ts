import { Request } from './Request';
import { Response } from './Response';
import { Validator } from '@arikajs/validation';

/**
 * Base Controller class providing common utility methods
 */
export abstract class Controller {
    /**
     * Create a JSON response
     */
    protected json(response: Response, data: any, status: number = 200): Response {
        return response.json(data, status);
    }

    /**
     * Validate the given request with the given rules
     */
    protected async validate(request: Request, rules: Record<string, string>, messages: Record<string, string> = {}): Promise<any> {
        const validator = new Validator(request.all(), rules, messages);

        if (await validator.fails()) {
            // In a real framework, this might throw a ValidationException
            // for the global handler to catch and return 422
            return {
                fails: true,
                errors: validator.errors()
            };
        }

        return {
            fails: false,
            data: validator.validated()
        };
    }
}
