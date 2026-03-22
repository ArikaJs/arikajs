
import { Request } from './Request';
import { Validator, ValidationError } from '@arikajs/validation';
import { UnauthorizedHttpException } from './Exceptions/HttpException';

/**
 * Base class for Form Requests.
 */
export abstract class FormRequest extends Request {
    /**
     * The validated data.
     */
    protected _validated: Record<string, any> = {};

    /**
     * Get the validation rules that apply to the request.
     */
    public abstract rules(): Record<string, any>;

    /**
     * Determine if the user is authorized to make this request.
     */
    public authorize(): boolean {
        return true;
    }

    /**
     * Get custom messages for validator errors.
     */
    public messages(): Record<string, string> {
        return {};
    }

    /**
     * Validate the class instance.
     */
    public async validateForm(): Promise<void> {
        if (!this.authorize()) {
            throw new UnauthorizedHttpException('This action is unauthorized.');
        }

        const validator = new Validator(this.all(), this.rules(), this.messages());

        if (await validator.fails()) {
            const errors = validator.errors();
            
            if (this.expectsJson()) {
                 throw new ValidationError(errors);
            }

            // Redirect back with errors if session is available
            if (this.session && typeof this.session.flash === 'function') {
                this.session.flash('errors', errors);
                this.session.flash('old', this.all());
            }

            throw new ValidationError(errors);
        }

        this._validated = validator.validated();
    }

    /**
     * Get the validated data.
     */
    public validated(): Record<string, any> {
        return this._validated;
    }
}
