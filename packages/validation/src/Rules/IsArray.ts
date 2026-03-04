import { Rule } from '../Rule';

export class IsArray implements Rule {
    validate(value: any): boolean {
        return Array.isArray(value);
    }

    message(): string {
        return 'The :attribute must be an array.';
    }
}
