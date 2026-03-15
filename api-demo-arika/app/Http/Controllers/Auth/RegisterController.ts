import { Request, Response, Mail, Hasher, config, Log, lang, app } from 'arikajs';
import { User } from '@Models/User';
import { VerifyEmail } from '@Mail/Auth/VerifyEmail';

export class RegisterController {
    /**
     * Handle a registration request for the application.
     */
    public async register(req: Request, res: Response) {
        const { name, email, password } = await req.validate({
            name: 'required|string|min:2',
            email: 'required|email',
            password: 'required|string|min:8|confirmed',
        });

        const existingUser = await User.where('email', email).first();
        if (existingUser) {
            return res.json({ error: lang('auth.email_taken') }, 409);
        }

        const hashedPassword = await Hasher.make(password);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            email_verified_at: null
        });

        // Send Verification Email
        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const verificationUrl = `${appUrl}/api/auth/verify?email=${encodeURIComponent(email)}&token=${Buffer.from(email).toString('base64')}`;

        try {
            await Mail.to(email).send(new VerifyEmail(name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to send verification email', { error: (e as Error).message, email });
        }

        // Return response (JWT logic)
        let token = undefined;
        const guard = req.auth.guard('api');
        if (guard && (guard.constructor.name === 'JwtGuard' || (guard as any).issueTokens)) {
            const result = await (guard as any).issueTokens(user);
            token = result.access_token;
        }

        return res.json({ 
            message: lang('auth.register_success'),
            access_token: token,
            user 
        });
    }
}
