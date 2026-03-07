import { Request, Response, Validator, Mail, config, Log, lang, DB } from 'arikajs';
import { User } from '../../../Models/User';
import { ResetPassword } from '../../../Mail/Auth/ResetPassword';
import { VerifyEmail } from '../../../Mail/Auth/VerifyEmail';
import * as crypto from 'crypto';

export class ForgotPasswordController {
    /**
     * Send a reset link to the given user.
     */
    public async sendResetLinkEmail(req: Request, res: Response) {
        const validator = new Validator(req.all(), {
            email: 'required|email',
        });

        if (await validator.fails()) {
            return res.json({ error: lang('validation.email'), messages: validator.errors() }, 422);
        }

        const { email } = validator.validated();
        const user = await User.where('email', email).first() as any;

        if (!user) {
            return res.json({ error: lang('auth.user_not_found') }, 404);
        }

        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');

        // Check if user is verified
        if (user.hasVerifiedEmail && !user.hasVerifiedEmail()) {
            const verificationUrl = `${appUrl}/api/auth/verify?email=${encodeURIComponent(email)}&token=${Buffer.from(email).toString('base64')}`;
            
            try {
                // Send verification link instead
                await Mail.to(email).send(new VerifyEmail(user.name, verificationUrl, appName));
                return res.json({ 
                    message: "Account unverified. A new verification link has been sent to your email." 
                });
            } catch (e) {
                Log.error('Failed to send verification email', { error: (e as Error).message, email });
            }
        }

        // Proceed with Password Reset
        const token = crypto.randomBytes(32).toString('hex');

        await DB.table('password_resets').where('email', email).delete();
        await DB.table('password_resets').insert({
            email,
            token,
            created_at: new Date()
        });

        const resetUrl = `${appUrl}/api/auth/password/reset?email=${encodeURIComponent(email)}&token=${token}`;

        try {
            await Mail.to(email).send(new ResetPassword(resetUrl, appName));
        } catch (e) {
            Log.error('Failed to send reset email', { error: (e as Error).message, email });
        }
        
        return res.json({ message: lang('auth.reset_link_sent') });
    }
}
