import { Rule } from '../Rule';

export class AlphaNum implements Rule {
    validate(value: any): boolean {
        if (typeof value !== 'string' && typeof value !== 'number') return false;
        return /^[A-ZÅÄÖa-zåäö0-9]+$/.test(String(value));
    }

    message(): string {
        return 'The :attribute must only contain letters and numbers.';
    }
}
