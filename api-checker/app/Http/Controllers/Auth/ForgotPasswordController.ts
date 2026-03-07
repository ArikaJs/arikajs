import { Request, Response, Validator, Mail, config, Log, lang, DB } from 'arikajs';
import { User } from '../../../Models/User';
import { ResetPassword } from '../../../Mail/Auth/ResetPassword';
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
        const user = await User.where('email', email).first();

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');

            await DB.table('password_resets').where('email', email).delete();
            await DB.table('password_resets').insert({
                email,
                token,
                created_at: new Date()
            });

            const appName = config('app.name', 'ArikaJS App');
            const appUrl = config('app.url', 'http://localhost:3000');
            const resetUrl = `${appUrl}/api/auth/password/reset?email=${encodeURIComponent(email)}&token=${token}`;

            try {
                await Mail.to(email).send(new ResetPassword(resetUrl, appName));
            } catch (e) {
                Log.error('Failed to send reset email', { error: (e as Error).message, email });
            }
        }
        
        return res.json({ message: lang('auth.reset_link_sent') });
    }
}
