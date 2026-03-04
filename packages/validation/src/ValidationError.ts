export class ValidationError extends Error {
    constructor(public errors: Record<string, string[]>) {
        super('The given data was invalid.');
        this.name = 'ValidationError';
    }
}
