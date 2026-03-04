export class AuthorizationException extends Error {
    public statusCode: number = 403;
    public code: string | null;

    constructor(message: string = 'This action is unauthorized.', code: string | null = null) {
        super(message);
        this.name = 'AuthorizationException';
        this.code = code;
    }
}
