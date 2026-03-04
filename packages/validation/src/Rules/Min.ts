import { Rule } from '../Rule';

export class Min implements Rule {
    private min: number;

    constructor(min: number) {
        this.min = min;
    }

    validate(value: any): boolean {
        if (value === null || value === undefined) return true;

        if (typeof value === 'number') {
            return value >= this.min;
        }

        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length >= this.min;
        }

        return false;
    }

    message(): string {
        return `The :attribute must be at least ${this.min}.`;
    }
}
