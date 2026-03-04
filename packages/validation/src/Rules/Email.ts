import { Rule } from '../Rule';

export class Email implements Rule {
    validate(value: any): boolean {
        if (!value) return true; // Let 'required' handle empty values
        if (typeof value !== 'string') return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    message(): string {
        return 'The :attribute must be a valid email address.';
    }
}
