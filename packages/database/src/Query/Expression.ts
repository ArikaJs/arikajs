
/**
 * Raw query expression
 */
export class Expression {
    constructor(protected value: string | number) { }

    /**
     * Get the value of the expression
     */
    getValue(): string | number {
        return this.value;
    }

    /**
     * Convert the expression to a string
     */
    toString(): string {
        return String(this.getValue());
    }
}
