
import { ServiceProvider } from '@arikajs/foundation';
import { Validator } from '@arikajs/validation';
import { ValidateRequestMiddleware } from '../http/Middleware/ValidateRequestMiddleware';

export class ValidationServiceProvider extends ServiceProvider {
    /**
     * Register validation services.
     */
    public async register() {
        this.app.singleton('validator', () => {
            return {
                make: (data: any, rules: any, messages: any = {}) => {
                    return new Validator(data, rules, messages);
                }
            };
        });

        // Register the validation middleware
        this.app.bind(ValidateRequestMiddleware, () => {
            return new ValidateRequestMiddleware();
        });
    }
}
