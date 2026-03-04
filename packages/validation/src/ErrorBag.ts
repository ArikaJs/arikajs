export class ErrorBag {
    private errors: Record<string, string[]> = {};

    /**
     * Add an error message for a specific field.
     */
    public add(field: string, message: string): void {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    /**
     * Determine if the error bag is empty.
     */
    public isEmpty(): boolean {
        return Object.keys(this.errors).length === 0;
    }

    /**
     * Determine if there are any errors.
     */
    public isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    /**
     * Get all error messages.
     */
    public all(): Record<string, string[]> {
        return this.errors;
    }

    /**
     * Get the first error message for a specific field.
     */
    public first(field: string): string | null {
        return this.errors[field] ? this.errors[field][0] : null;
    }

    /**
     * Determine if a field has an error.
     */
    public has(field: string): boolean {
        return !!this.errors[field];
    }
}
