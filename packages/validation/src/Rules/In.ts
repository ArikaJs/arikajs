import { Rule } from '../Rule';

export class In implements Rule {
    private allowedValues: any[];

    constructor(allowedValues: any[]) {
        this.allowedValues = allowedValues;
    }

    validate(value: any): boolean {
        return this.allowedValues.map(String).includes(String(value));
    }

    message(): string {
        return 'The selected :attribute is invalid.';
    }
}
