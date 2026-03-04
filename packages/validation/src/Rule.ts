export interface Rule {
    /**
     * Determine if the validation rule passes.
     */
    validate(value: any, attribute: string, params?: string[]): boolean | Promise<boolean>;

    /**
     * Get the validation error message.
     */
    message(): string;
}
