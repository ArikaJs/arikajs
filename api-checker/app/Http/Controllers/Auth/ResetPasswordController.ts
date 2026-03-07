import { Request, Response, Validator, Hasher, lang, DB } from 'arikajs';
import { User } from '../../../Models/User';

export class ResetPasswordController {
    /**
     * Reset the given user's password.
     */
    public async reset(req: Request, res: Response) {
        const validator = new Validator(req.all(), {
            token: 'required',
            email: 'required|email',
            password: 'required|string|min:8|confirmed',
        });

        if (await validator.fails()) {
            return res.json({ error: lang('validation.failed'), messages: validator.errors() }, 422);
        }

        const { token, email, password } = validator.validated();
        
        // Verify token against database
        const resetRecord = await DB.table('password_resets').where('email', email).where('token', token).first();
        if (!resetRecord) {
            return res.json({ error: lang('auth.invalid_reset_token') }, 403);
        }

        const user = await User.where('email', email).first() as any;
        if (!user) {
            return res.json({ error: lang('auth.user_not_found') }, 404);
        }

        await user.update({
            password: await Hasher.make(password)
        });

        // Delete the used token
        await DB.table('password_resets').where('email', email).delete();

        return res.json({ message: lang('auth.password_reset_success') });
    }
}
