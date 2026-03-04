
import { Request, Response } from '@arikajs/http';
import { Validator } from '@arikajs/validation';

export class ValidateRequestMiddleware {
    protected rules: Record<string, any> = {};

    /**
     * Set the validation rules.
     */
    public using(rules: Record<string, any>): this {
        this.rules = rules;
        return this;
    }

    /**
     * Handle the incoming request.
     */
    public async handle(request: Request, next: (request: Request) => Promise<Response>, response: Response): Promise<Response> {
        if (Object.keys(this.rules).length === 0) {
            return next(request);
        }

        const validator = new Validator(request.all(), this.rules);

        if (await validator.fails()) {
            return response.status(422).json({
                message: 'The given data was invalid.',
                errors: validator.errors()
            });
        }

        return next(request);
    }
}
