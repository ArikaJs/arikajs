import { TrimStrings as Middleware } from 'arikajs';

export class TrimStrings extends Middleware {
    /**
     * The names of the attributes that should not be trimmed.
     */
    protected except: string[] = [
        'current_password',
        'password',
        'password_confirmation',
    ];
}
