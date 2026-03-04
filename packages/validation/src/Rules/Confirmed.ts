import { Rule } from '../Rule';

export class Confirmed implements Rule {
    private data: any;

    constructor(data: any) {
        this.data = data;
    }

    validate(value: any, attribute: string): boolean {
        const confirmField = `${attribute}_confirmation`;
        return value === this.data[confirmField];
    }

    message(): string {
        return 'The :attribute confirmation does not match.';
    }
}
