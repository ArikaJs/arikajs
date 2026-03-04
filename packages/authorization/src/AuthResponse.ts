/**
 * Represents the result of an authorization check.
 * Allows gates/policies to return custom denial messages instead of just true/false.
 */
export class AuthResponse {
    private _allowed: boolean;
    private _message: string | null;
    private _code: string | null;

    constructor(allowed: boolean, message: string | null = null, code: string | null = null) {
        this._allowed = allowed;
        this._message = message;
        this._code = code;
    }

    public allowed(): boolean {
        return this._allowed;
    }

    public denied(): boolean {
        return !this._allowed;
    }

    public message(): string | null {
        return this._message;
    }

    public code(): string | null {
        return this._code;
    }

    /**
     * Create an "allow" response.
     */
    public static allow(message: string | null = null): AuthResponse {
        return new AuthResponse(true, message);
    }

    /**
     * Create a "deny" response with an optional custom message.
     */
    public static deny(message: string = 'This action is unauthorized.', code: string | null = null): AuthResponse {
        return new AuthResponse(false, message, code);
    }
}
