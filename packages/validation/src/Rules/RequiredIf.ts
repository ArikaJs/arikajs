
import { Rule } from '../Rule';

export class RequiredIf implements Rule {
    private otherField: string;
    private otherValue: any;
    private data: any;

    constructor(otherField: string, otherValue: any, data: any) {
        this.otherField = otherField;
        this.otherValue = otherValue;
        this.data = data;
    }

    async validate(value: any): Promise<boolean> {
        const otherValue = this.getDataValue(this.otherField);

        if (String(otherValue) === String(this.otherValue)) {
            return value !== null && value !== undefined && value !== '';
        }

        return true;
    }

    message(): string {
        return `The :attribute field is required when ${this.otherField} is ${this.otherValue}.`;
    }

    private getDataValue(key: string): any {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), this.data);
    }
}
