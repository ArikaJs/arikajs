import { VerifyCsrfToken as Middleware } from 'arikajs';

export class VerifyCsrfToken extends Middleware {
    /**
     * The URIs that should be excluded from CSRF verification.
     */
    protected except: string[] = [
        //
    ];
}
