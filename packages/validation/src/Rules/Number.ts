import { Rule } from '../Rule';

export class IsNumber implements Rule {
    validate(value: any): boolean {
        if (value === null || value === undefined) return true;
        return typeof value === 'number' && !isNaN(value);
    }

    message(): string {
        return 'The :attribute must be a number.';
    }
}
