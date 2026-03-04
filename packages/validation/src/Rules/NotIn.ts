import { Rule } from '../Rule';

export class NotIn implements Rule {
    private disallowedValues: any[];

    constructor(disallowedValues: any[]) {
        this.disallowedValues = disallowedValues;
    }

    validate(value: any): boolean {
        return !this.disallowedValues.map(String).includes(String(value));
    }

    message(): string {
        return 'The selected :attribute is invalid.';
    }
}
