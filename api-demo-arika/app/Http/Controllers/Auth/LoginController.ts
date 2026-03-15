import { Request, Response, Log, lang, app } from 'arikajs';
import { User } from '@Models/User';

export class LoginController {
    /**
     * Handle an incoming authentication request.
     */
    public async login(req: Request, res: Response) {
        const credentials = await req.validate({
            email: 'required|email',
            password: 'required|string',
        });

        const guard = req.auth.guard('api');
        const result = await guard.attempt(credentials);

        if (!result) {
            Log.info('Failed login attempt', { email: credentials.email });
            return res.json({ error: lang('auth.failed') }, 401);
        }

        const user = await guard.user();

        // JwtGuard.attempt() returns { access_token, refresh_token? } on success
        const access_token = typeof result === 'object' && result.access_token 
            ? result.access_token 
            : (typeof result === 'string' ? result : undefined);

        return res.json({ 
            message: lang('auth.login_success'),
            access_token,
            user 
        });
    }

    /**
     * Get the authenticated user.
     */
    public async me(req: Request, res: Response) {
        const user = await req.auth.guard('api').user() as User | null;
        if (!user) {
            return res.json({ error: lang('auth.unauthenticated') }, 401);
        }
        return res.json({ user });
    }

    /**
     * Log the user out of the application.
     */
    public async logout(req: Request, res: Response) {
        try {
            await req.auth.guard('api').logout();
        } catch (e) {
            Log.error('Logout error', { error: (e as Error).message });
        }
        
        return res.json({ message: lang('auth.logout_success') });
    }
}
