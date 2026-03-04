import { Rule } from '../Rule';

export class Alpha implements Rule {
    validate(value: any): boolean {
        if (typeof value !== 'string') return false;
        return /^[A-ZÅÄÖa-zåäö]+$/.test(value);
    }

    message(): string {
        return 'The :attribute must only contain letters.';
    }
}
