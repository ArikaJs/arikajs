import { Rule } from '../Rule';

export class IsBoolean implements Rule {
    validate(value: any): boolean {
        const acceptable = [true, false, 1, 0, '1', '0', 'true', 'false'];
        return acceptable.includes(value);
    }

    message(): string {
        return 'The :attribute field must be true or false.';
    }
}
