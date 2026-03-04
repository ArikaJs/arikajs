import { Rule } from '../Rule';

export class IsString implements Rule {
    validate(value: any): boolean {
        if (value === null || value === undefined) return true;
        return typeof value === 'string';
    }

    message(): string {
        return 'The :attribute must be a string.';
    }
}
