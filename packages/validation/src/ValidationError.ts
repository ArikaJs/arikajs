export class ValidationError extends Error {
    public status = 422;

    constructor(public errors: Record<string, string[]>) {
        super('The given data was invalid.');
        this.name = 'ValidationError';
    }

    /**
     * Render the error into an HTTP response.
     */
    public render(request: any, response: any) {
        if (request.expectsJson()) {
            return response.status(this.status).json({
                message: this.message,
                errors: this.errors
            });
        }

        // For web requests, we redirect back with errors and old input
        // Note: ArikaJS should have a session.flashErrors or similar. 
        // For now, we'll redirect back. If sessions are enabled, they will handle the flashing.
        if (typeof response.back === 'function') {
            return response.back(request);
        }

        return response.status(this.status).json({
            message: this.message,
            errors: this.errors
        });
    }
}
