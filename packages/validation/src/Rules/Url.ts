import { Rule } from '../Rule';

export class Url implements Rule {
    validate(value: any): boolean {
        if (typeof value !== 'string') return false;
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    message(): string {
        return 'The :attribute format is invalid.';
    }
}
