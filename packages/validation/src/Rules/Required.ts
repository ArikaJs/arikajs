import { Rule } from '../Rule';

export class Required implements Rule {
    validate(value: any): boolean {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string' && value.trim() === '') {
            return false;
        }

        if (Array.isArray(value) && value.length === 0) {
            return false;
        }

        return true;
    }

    message(): string {
        return 'The :attribute field is required.';
    }
}
