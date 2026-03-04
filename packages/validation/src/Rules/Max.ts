import { Rule } from '../Rule';

export class Max implements Rule {
    private max: number;

    constructor(max: number) {
        this.max = max;
    }

    validate(value: any): boolean {
        if (value === null || value === undefined) return true;

        if (typeof value === 'number') {
            return value <= this.max;
        }

        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length <= this.max;
        }

        return false;
    }

    message(): string {
        return `The :attribute must not be greater than ${this.max}.`;
    }
}
