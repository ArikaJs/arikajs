import { Request, Response, Mail, config, Log, lang } from 'arikajs';
import { User } from '../../../Models/User';
import { VerifyEmail } from '../../../Mail/Auth/VerifyEmail';

export class VerifyEmailController {
    /**
     * Mark the authenticated user's email address as verified.
     */
    public async verify(req: Request, res: Response) {
        const { email, token } = req.all();

        if (!email || !token) {
            return res.json({ error: lang('auth.missing_verification_data') }, 400);
        }

        const expectedToken = Buffer.from(email).toString('base64');
        if (token !== expectedToken) {
            Log.warning('Invalid email verification attempt', { email, token });
            return res.json({ error: lang('auth.invalid_verification_token') }, 403);
        }

        const user = await User.where('email', email).first() as any;
        if (!user) {
            return res.json({ error: lang('auth.user_not_found') }, 404);
        }

        if (user.email_verified_at) {
            return res.json({ message: lang('auth.email_already_verified') });
        }

        try {
            await user.update({
                email_verified_at: new Date()
            });
        } catch (e) {
            Log.error('Email verification update failed', { error: (e as Error).message, email });
            return res.json({ error: lang('auth.verification_failed') }, 500);
        }

        return res.json({ message: lang('auth.email_verified') });
    }

    /**
     * Resend the email verification notification.
     * The user is already authenticated via the auth middleware.
     */
    public async resend(req: Request, res: Response) {
        // Get the authenticated user directly from the JWT guard
        const user = await (req as any).auth.guard('api').user() as any;

        if (!user) {
            return res.json({ error: lang('auth.unauthenticated') }, 401);
        }

        if (user.email_verified_at) {
            return res.json({ message: lang('auth.email_already_verified') });
        }

        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const verificationUrl = `${appUrl}/api/auth/verify?email=${encodeURIComponent(user.email)}&token=${Buffer.from(user.email).toString('base64')}`;

        try {
            await Mail.to(user.email).send(new VerifyEmail(user.name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to resend verification email', { error: (e as Error).message, email: user.email });
            return res.json({ error: lang('auth.verification_failed') }, 500);
        }

        return res.json({ message: lang('auth.verification_resent') });
    }
}
