import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';

export class AuthApiInstallCommand extends Command {
    public signature = 'auth:install:api {--force}';
    public description = 'Scaffold API authentication routes (JWT-based)';

    public async handle() {
        this.info('Scaffolding authentication system...');

        const force = this.option('force');
        const cwd = process.cwd();

        // Target Paths
        const configPath = path.join(cwd, 'config', 'auth.ts');
        const modelPath = path.join(cwd, 'app', 'Models', 'User.ts');
        const authControllerDir = path.join(cwd, 'app', 'Http', 'Controllers', 'Auth');
        const middlewarePath = path.join(cwd, 'app', 'Http', 'Middleware', 'Authenticate.ts');
        const langEnDir = path.join(cwd, 'resources', 'lang', 'en');
        const authLangPath = path.join(langEnDir, 'auth.json');
        const validationLangPath = path.join(langEnDir, 'validation.json');

        // Generate timestamped migration name
        const date = new Date();
        const baseTimestamp = date.getFullYear().toString() + '_' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '_' +
            date.getDate().toString().padStart(2, '0') + '_' +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0');
        const timestamp1 = baseTimestamp + date.getSeconds().toString().padStart(2, '0');
        const timestamp2 = baseTimestamp + (date.getSeconds() + 1).toString().padStart(2, '0');

        const migrationDir = path.join(cwd, 'database', 'migrations');
        const usersMigrationPath = path.join(migrationDir, `${timestamp1}_create_users_table.ts`);
        const passwordMigrationPath = path.join(migrationDir, `${timestamp2}_create_password_resets_table.ts`);

        // Check if any file exists unless --force is used
        if (!force) {
            const existingFiles = [configPath, modelPath, middlewarePath]
                .filter(p => fs.existsSync(p));

            if (existingFiles.length > 0) {
                this.error('Authentication scaffold failed. The following files already exist:');
                existingFiles.forEach(f => this.writeln(`  - ${f}`));
                this.info('Use the --force flag to overwrite them.');
                return;
            }
        }

        // Ensure directories exist
        [
            path.dirname(configPath),
            path.dirname(modelPath),
            authControllerDir,
            path.dirname(middlewarePath),
            migrationDir,
            langEnDir
        ].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // Publish configuration and core files
        fs.writeFileSync(configPath, this.getConfigStub());
        fs.writeFileSync(modelPath, this.getModelStub());
        fs.writeFileSync(middlewarePath, this.getMiddlewareStub());

        // Publish Controllers
        fs.writeFileSync(path.join(authControllerDir, 'LoginController.ts'), this.getLoginControllerStub());
        fs.writeFileSync(path.join(authControllerDir, 'RegisterController.ts'), this.getRegisterControllerStub());
        fs.writeFileSync(path.join(authControllerDir, 'ForgotPasswordController.ts'), this.getForgotPasswordControllerStub());
        fs.writeFileSync(path.join(authControllerDir, 'ResetPasswordController.ts'), this.getResetPasswordControllerStub());
        fs.writeFileSync(path.join(authControllerDir, 'VerifyEmailController.ts'), this.getVerifyEmailControllerStub());

        // Publish Mailables
        const mailAuthDir = path.join(cwd, 'app', 'Mail', 'Auth');
        if (!fs.existsSync(mailAuthDir)) fs.mkdirSync(mailAuthDir, { recursive: true });
        fs.writeFileSync(path.join(mailAuthDir, 'VerifyEmail.ts'), this.getVerifyEmailMailableStub());
        fs.writeFileSync(path.join(mailAuthDir, 'ResetPassword.ts'), this.getResetPasswordMailableStub());

        // Publish Email Views
        const emailViewDir = path.join(cwd, 'resources', 'views', 'emails', 'auth');
        if (!fs.existsSync(emailViewDir)) fs.mkdirSync(emailViewDir, { recursive: true });

        const verifyViewPath = path.join(emailViewDir, 'verify_email.ark.html');
        const resetViewPath = path.join(emailViewDir, 'reset_password.ark.html');

        if (!fs.existsSync(verifyViewPath) || force) {
            fs.writeFileSync(verifyViewPath, this.getVerifyEmailViewStub());
        }
        if (!fs.existsSync(resetViewPath) || force) {
            fs.writeFileSync(resetViewPath, this.getResetPasswordViewStub());
        }

        // Publish Localization files
        if (!fs.existsSync(authLangPath) || force) {
            fs.writeFileSync(authLangPath, this.getAuthLangStub());
        }
        if (!fs.existsSync(validationLangPath) || force) {
            fs.writeFileSync(validationLangPath, this.getValidationLangStub());
        }

        // Check if migrations already exist
        const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
        if (!migrations.some(file => file.includes('create_users_table'))) {
            fs.writeFileSync(usersMigrationPath, this.getUsersMigrationStub());
        }
        if (!migrations.some(file => file.includes('create_password_resets_table'))) {
            fs.writeFileSync(passwordMigrationPath, this.getPasswordResetMigrationStub());
        }

        // Update Routes
        this.appendRoutes();
        this.registerMiddleware();
        this.updateEnv();

        this.writeln('');
        this.success('Premium API Authentication scaffolding generated successfully!');
        this.info('Next steps:');
        this.writeln(' 1. Run "arika migrate" to create the users table');
        this.writeln(' 2. Use the "api" guard in your auth configuration');
    }

    private updateEnv() {
        const cwd = process.cwd();
        const envPath = path.join(cwd, '.env');
        if (!fs.existsSync(envPath)) return;

        let content = fs.readFileSync(envPath, 'utf8');
        if (!content.includes('JWT_SECRET=')) {
            const secret = crypto.randomBytes(32).toString('hex');
            content += `\n# Authentication\nJWT_SECRET=${secret}\n`;
            fs.writeFileSync(envPath, content);
            this.success('  ✅ JWT_SECRET has been automatically added to your .env file.');
        }
    }

    private getConfigStub() {
        return `import { User } from '../app/Models/User';

export default {
    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option controls the default authentication "guard" and password
    | reset options for your application.
    |
    */
    default: 'api',

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Supported Drivers: "session", "jwt", "token", "basic"
    |
    */
    guards: {
        web: {
            driver: 'session',
            provider: 'users',
        },
        api: {
            driver: 'jwt',
            provider: 'users',
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
            options: {
                expiresIn: '24h',
            },
        },
    },

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication drivers have a user provider. This defines how the
    | users are actually retrieved out of your database.
    |
    */
    providers: {
        users: {
            driver: 'eloquent',
            model: User,
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Authentication Throttling & Locking
    |--------------------------------------------------------------------------
    |
    */
    lockout: {
        maxAttempts: 5,
        decayMinutes: 15,
    },
};
`;
    }

    private getModelStub() {
        return `import { Model } from 'arikajs';

export class User extends Model {
    protected static table = 'users';

    public declare id: number;
    public declare name: string;
    public declare email: string;
    public declare password: string;
    public declare email_verified_at: string | Date | null;

    protected fillable: string[] = [
        'name',
        'email',
        'password',
        'email_verified_at',
    ];

    protected hidden: string[] = [
        'password',
    ];

    public hasVerifiedEmail(): boolean {
        return this.email_verified_at !== null;
    }
}
`;
    }

    private getUsersMigrationStub() {
        return `import { Migration, SchemaBuilder } from 'arikajs';

export default class CreateUsersTable extends Migration {
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('users');
        await schema.create('users', (table: any) => {
            table.id();
            table.string('name');
            table.string('email').unique();
            table.timestamp('email_verified_at').nullable();
            table.string('password');
            table.string('remember_token', 100).nullable();
            table.string('refresh_token', 100).nullable();
            table.timestamps();
        });
    }

    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('users');
    }
}
`;
    }

    private getPasswordResetMigrationStub() {
        return `import { Migration, SchemaBuilder } from 'arikajs';

export default class CreatePasswordResetsTable extends Migration {
    public async up(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('password_resets');
        await schema.create('password_resets', (table: any) => {
            table.string('email').index();
            table.string('token');
            table.timestamp('created_at').nullable();
        });
    }

    public async down(schema: SchemaBuilder): Promise<void> {
        await schema.dropIfExists('password_resets');
    }
}
`;
    }

    private getLoginControllerStub() {
        return `import { Request, Response, Log, lang, app } from 'arikajs';

export class LoginController {
    /**
     * Handle an incoming authentication request.
     */
    public async login(req: Request, res: Response) {
        const credentials = req.only(['email', 'password']);

        if (!credentials.email || !credentials.password) {
            return res.json({ error: lang('auth.failed_required') }, 400);
        }

        if (!(req as any).auth) {
            (app().make('auth') as any).createContext(req);
        }
        // Use the 'api' (JWT) guard for API login so a token is issued
        const guard = (req as any).auth.guard('api');
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
        const user = await (req as any).auth.guard('api').user();
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
            await (req as any).auth.guard('api').logout();
        } catch (e) {
            Log.error('Logout error', { error: (e as Error).message });
        }
        
        return res.json({ message: lang('auth.logout_success') });
    }
}
`;
    }

    private getRegisterControllerStub() {
        return `import { Request, Response, Validator, Mail, Hasher, config, Log, lang, app } from 'arikajs';
import { User } from '../../../Models/User';
import { VerifyEmail } from '../../../Mail/Auth/VerifyEmail';

export class RegisterController {
    /**
     * Handle a registration request for the application.
     */
    public async register(req: Request, res: Response) {
        const validator = new Validator(req.all(), {
            name: 'required|string|min:2',
            email: 'required|email',
            password: 'required|string|min:8|confirmed',
        });

        if (await validator.fails()) {
            return res.json({ 
                error: lang('validation.failed'), 
                messages: validator.errors() 
            }, 422);
        }

        const { name, email, password } = validator.validated();

        const existingUser = await User.where('email', email).first();
        if (existingUser) {
            return res.json({ error: lang('auth.email_taken') }, 409);
        }

        const hashedPassword = await Hasher.make(password);

        const user = await (User as any).create({
            name,
            email,
            password: hashedPassword,
            email_verified_at: null
        });

        // Send Verification Email
        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const verificationUrl = \`\${appUrl}/api/auth/verify?email=\${encodeURIComponent(email)}&token=\${Buffer.from(email).toString('base64')}\`;

        try {
            await Mail.to(email).send(new VerifyEmail(name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to send verification email', { error: (e as Error).message, email });
        }

        // Return response (JWT logic)
        let token = undefined;
        if (!(req as any).auth) {
            (app().make('auth') as any).createContext(req);
        }
        const guard = (req as any).auth.guard('api');
        if (guard && (guard.constructor.name === 'JwtGuard' || guard.issueTokens)) {
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
`;
    }

    private getForgotPasswordControllerStub() {
        return `import { Request, Response, Validator, Mail, config, Log, lang, DB } from 'arikajs';
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
            const verificationUrl = \`\${appUrl}/api/auth/verify?email=\${encodeURIComponent(email)}&token=\${Buffer.from(email).toString('base64')}\`;
            
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

        const resetUrl = \`\${appUrl}/api/auth/password/reset?email=\${encodeURIComponent(email)}&token=\${token}\`;

        try {
            await Mail.to(email).send(new ResetPassword(resetUrl, appName));
        } catch (e) {
            Log.error('Failed to send reset email', { error: (e as Error).message, email });
        }
        
        return res.json({ message: lang('auth.reset_link_sent') });
    }
}
`;
    }

    private getResetPasswordControllerStub() {
        return `import { Request, Response, Validator, Hasher, lang, DB } from 'arikajs';
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
`;
    }

    private getVerifyEmailControllerStub() {
        return `import { Request, Response, Mail, config, Log, lang } from 'arikajs';
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
        const verificationUrl = \`\${appUrl}/api/auth/verify?email=\${encodeURIComponent(user.email)}&token=\${Buffer.from(user.email).toString('base64')}\`;

        try {
            await Mail.to(user.email).send(new VerifyEmail(user.name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to resend verification email', { error: (e as Error).message, email: user.email });
            return res.json({ error: lang('auth.verification_failed') }, 500);
        }

        return res.json({ message: lang('auth.verification_resent') });
    }
}
`;
    }

    private getVerifyEmailMailableStub() {
        return `import { Mailable } from 'arikajs';

export class VerifyEmail extends Mailable {
    constructor(
        private name: string,
        private verificationUrl: string,
        private appName: string
    ) {
        super();
    }

    public build() {
        return this.subject('Verify Your Email Address')
            .view('emails/auth/verify_email', {
                name: this.name,
                verification_url: this.verificationUrl,
                app_name: this.appName,
                year: new Date().getFullYear()
            });
    }
}
`;
    }

    private getResetPasswordMailableStub() {
        return `import { Mailable } from 'arikajs';

export class ResetPassword extends Mailable {
    constructor(
        private resetUrl: string,
        private appName: string
    ) {
        super();
    }

    public build() {
        return this.subject('Reset Password Notification')
            .view('emails/auth/reset_password', {
                reset_url: this.resetUrl,
                app_name: this.appName,
                year: new Date().getFullYear()
            });
    }
}
`;
    }

    private getMiddlewareStub() {
        return `import { Authenticate as Middleware } from 'arikajs';

export class Authenticate extends Middleware {
    /**
     * Handle an unauthenticated user.
     */
    protected unauthenticated(request: any, guards: string[], response: any): any {
        return response.json({ error: 'Unauthenticated.' }, 401);
    }
}
`;
    }

    private appendRoutes() {
        const cwd = process.cwd();
        const apiRoutesPath = path.join(cwd, 'routes', 'api.ts');
        if (!fs.existsSync(apiRoutesPath)) return;

        let content = fs.readFileSync(apiRoutesPath, 'utf8');

        // Add imports if they don't exist
        const imports = [
            "import { LoginController } from '../app/Http/Controllers/Auth/LoginController';",
            "import { RegisterController } from '../app/Http/Controllers/Auth/RegisterController';",
            "import { ForgotPasswordController } from '../app/Http/Controllers/Auth/ForgotPasswordController';",
            "import { ResetPasswordController } from '../app/Http/Controllers/Auth/ResetPasswordController';",
            "import { VerifyEmailController } from '../app/Http/Controllers/Auth/VerifyEmailController';"
        ];

        imports.forEach(imp => {
            if (!content.includes(imp)) {
                content = imp + "\n" + content;
            }
        });

        if (!content.includes("Route.group({ prefix: 'auth'")) {
            const routeDefinitions = `
// Authentication Routes (API)
Route.group({ prefix: 'auth' }, () => {
    Route.post('/register', [RegisterController, 'register']);
    Route.post('/login', [LoginController, 'login']);
    Route.post('/logout', [LoginController, 'logout']).withMiddleware('auth');

    // Email Verification
    Route.get('/verify', [VerifyEmailController, 'verify']);
    Route.post('/verification-notification', [VerifyEmailController, 'resend']).withMiddleware('auth');

    // Password Reset
    Route.post('/password/email', [ForgotPasswordController, 'sendResetLinkEmail']);
    Route.post('/password/reset', [ResetPasswordController, 'reset']);
});

Route.get('/user', [LoginController, 'me']).withMiddleware('auth');
`;
            content += routeDefinitions;
        }

        fs.writeFileSync(apiRoutesPath, content);
    }



    private registerMiddleware() {
        const cwd = process.cwd();
        const kernelPath = path.join(cwd, 'app', 'Http', 'Kernel.ts');
        if (!fs.existsSync(kernelPath)) return;

        let content = fs.readFileSync(kernelPath, 'utf8');

        // Add Authenticate import if not exists
        if (!content.includes("import { Authenticate } from './Middleware/Authenticate'")) {
            content = "import { Authenticate } from './Middleware/Authenticate';\n" + content;
        }

        // Register in routeMiddleware
        const authRegistration = "'auth': Authenticate,";

        // Case 1: Already registered (uncommented)
        if (content.includes(authRegistration) && !content.includes(`// ${authRegistration}`)) {
            // Already there and active
        }
        // Case 2: Commented out line
        else if (content.includes(`// ${authRegistration}`)) {
            content = content.replace(`// ${authRegistration}`, authRegistration);
        }
        // Case 3: Object.assign pattern (new templates)
        else if (content.includes('Object.assign((this as any).routeMiddleware, {')) {
            content = content.replace(
                'Object.assign((this as any).routeMiddleware, {',
                `Object.assign((this as any).routeMiddleware, {\n            ${authRegistration}`
            );
        }
        // Case 4: Standard property declaration (legacy templates)
        else if (content.includes('protected routeMiddleware = {')) {
            content = content.replace(
                'protected routeMiddleware = {',
                `protected routeMiddleware = {\n        ${authRegistration}`
            );
        }

        fs.writeFileSync(kernelPath, content);
    }

    private getAuthLangStub() {
        return JSON.stringify({
            "failed": "These credentials do not match our records.",
            "failed_required": "Email and password are required.",
            "throttle": "Too many login attempts. Please try again in :seconds seconds.",
            "login_success": "Successfully logged in.",
            "logout_success": "Successfully logged out.",
            "register_success": "Registration successful! Please check your email to verify your account.",
            "email_taken": "This email is already registered.",
            "unauthenticated": "You must be logged in to access this resource.",
            "email_verified": "Email address verified successfully!",
            "email_already_verified": "Email address is already verified.",
            "verification_failed": "Email verification failed. The link may be expired or invalid.",
            "verification_resent": "Verification link has been resent to your email address.",
            "missing_verification_data": "Missing verification data (email or token).",
            "invalid_verification_token": "The verification token is invalid.",
            "user_not_found": "We could not find a user with that email address.",
            "reset_link_sent": "If that email is registered, a password reset link has been sent.",
            "invalid_reset_token": "The password reset token is invalid.",
            "password_reset_success": "Your password has been reset successfully. You can now log in."
        }, null, 4);
    }

    private getValidationLangStub() {
        return JSON.stringify({
            "failed": "The given data was invalid.",
            "required": "The :attribute field is required.",
            "email": "The :attribute must be a valid email address.",
            "min": {
                "string": "The :attribute must be at least :min characters."
            },
            "confirmed": "The :attribute confirmation does not match."
        }, null, 4);
    }

    private getVerifyEmailViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #51545e; }
        .wrapper { width: 100%; margin: 0; padding: 0; -webkit-text-size-adjust: none; background-color: #f4f4f7; }
        .content { width: 100%; max-width: 570px; margin: 0 auto; padding: 35px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); }
        .header { padding: 25px 0; text-align: center; }
        .header a { font-size: 19px; font-weight: bold; color: #333; text-decoration: none; }
        .button { display: inline-block; background-color: #22bc66; color: #FFF !important; padding: 12px 25px; text-decoration: none; border-radius: 3px; font-weight: bold; }
        .footer { text-align: center; padding: 25px; font-size: 12px; color: #b0adc5; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header"><a href="#">{{ app_name }}</a></div>
        <div class="content">
            <h1>Verify your email address</h1>
            <p>Hi {{ name }},</p>
            <p>Thanks for signing up! Please confirm your email address by clicking the button below.</p>
            <p style="text-align: center;"><a href="{{ verification_url }}" class="button">Verify Email</a></p>
            <p>If you did not create an account, no further action is required.</p>
            <p>Regards,<br>{{ app_name }} Team</p>
        </div>
        <div class="footer">&copy; {{ year }} {{ app_name }}. All rights reserved.</div>
    </div>
</body>
</html>`;
    }

    private getResetPasswordViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #51545e; }
        .wrapper { width: 100%; margin: 0; padding: 0; -webkit-text-size-adjust: none; background-color: #f4f4f7; }
        .content { width: 100%; max-width: 570px; margin: 0 auto; padding: 35px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); }
        .header { padding: 25px 0; text-align: center; }
        .header a { font-size: 19px; font-weight: bold; color: #333; text-decoration: none; }
        .button { display: inline-block; background-color: #3869d4; color: #FFF !important; padding: 12px 25px; text-decoration: none; border-radius: 3px; font-weight: bold; }
        .footer { text-align: center; padding: 25px; font-size: 12px; color: #b0adc5; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header"><a href="#">{{ app_name }}</a></div>
        <div class="content">
            <h1>Reset your password</h1>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            <p style="text-align: center;"><a href="{{ reset_url }}" class="button">Reset Password</a></p>
            <p>This password reset link will expire in 60 minutes.</p>
            <p>If you did not request a password reset, no further action is required.</p>
            <p>Regards,<br>{{ app_name }} Team</p>
        </div>
        <div class="footer">&copy; {{ year }} {{ app_name }}. All rights reserved.</div>
    </div>
</body>
</html>`;
    }
}
