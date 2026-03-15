import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class AuthWebInstallCommand extends Command {
    public signature = 'auth:install:web {--force}';
    public description = 'Scaffold web authentication views and routes (Session-based)';

    public async handle() {
        this.info('Scaffolding authentication system...');

        const force = this.option('force');
        const cwd = process.cwd();

        // Target Paths
        const configPath = path.join(cwd, 'config', 'auth.ts');
        const sessionConfigPath = path.join(cwd, 'config', 'session.ts');
        const modelPath = path.join(cwd, 'app', 'Models', 'User.ts');
        const authControllerDir = path.join(cwd, 'app', 'Http', 'Controllers', 'Auth');

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
            const existingFiles = [configPath, sessionConfigPath, modelPath]
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
            migrationDir
        ].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // Publish configuration and core files
        fs.writeFileSync(configPath, this.getConfigStub());
        fs.writeFileSync(sessionConfigPath, this.getSessionConfigStub());
        fs.writeFileSync(modelPath, this.getModelStub());

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

        // Check if migrations already exist
        const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
        if (!migrations.some(file => file.includes('create_users_table'))) {
            fs.writeFileSync(usersMigrationPath, this.getUsersMigrationStub());
        }
        if (!migrations.some(file => file.includes('create_password_resets_table'))) {
            fs.writeFileSync(passwordMigrationPath, this.getPasswordResetMigrationStub());
        }

        // Update Routes and Views
        this.publishViews();
        this.appendWebRoutes();
        this.publishTranslations();
        this.updateWelcomeHeader();

        this.writeln('');
        this.success('Premium Web Authentication scaffolding generated successfully!');
    }

    private getConfigStub() {
        return `import { User } from '@Models/User';

export default {
    default: 'web',
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
    providers: {
        users: {
            driver: 'eloquent',
            model: User,
        },
    },
    lockout: {
        maxAttempts: 5,
        decayMinutes: 15,
    },
};
`;
    }

    private getSessionConfigStub() {
        return `export default {
    /**
     * Default session driver.
     * Supported: "memory", "file"
     * Set SESSION_DRIVER in your .env file.
     */
    driver: process.env.SESSION_DRIVER || 'file',

    /**
     * Session lifetime in minutes.
     * After this period, idle sessions are expired.
     */
    lifetime: Number(process.env.SESSION_LIFETIME) || 120,

    /**
     * Session cookie name.
     */
    cookie: process.env.SESSION_COOKIE || 'arika_session',

    /**
     * Cookie path — typically '/' for all routes.
     */
    path: '/',

    /**
     * Storage path for the file driver.
     */
    storagePath: './storage/sessions',

    /**
     * Mark the session cookie as Secure (HTTPS only).
     * Enable this in production.
     */
    secure: process.env.SESSION_SECURE === 'true',

    /**
     * Mark the session cookie as HttpOnly (not accessible to JS).
     */
    httpOnly: true,

    /**
     * SameSite cookie attribute.
     * Options: 'Lax', 'Strict', 'None'
     */
    sameSite: 'Lax',

    /**
     * Enable session locking to prevent race conditions.
     */
    locking: false,

    /**
     * Lock timeout in seconds.
     */
    lockTimeout: 10,

    /**
     * Garbage collection probability.
     * 0.01 = 1% of requests will trigger GC.
     */
    gcProbability: 0.01,
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

    protected fillable: string[] = ['name', 'email', 'password', 'email_verified_at'];
    protected hidden: string[] = ['password'];

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
        await schema.create('users', (table: any) => {
            table.id();
            table.string('name');
            table.string('email').unique();
            table.timestamp('email_verified_at').nullable();
            table.string('password');
            table.string('remember_token', 100).nullable();
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
        return `import { Request, Response, Log, lang, app, view } from 'arikajs';
import { User } from '@Models/User';

export class LoginController {
    /**
     * Show the application's login form.
     */
    public async showLogin(req: Request, res: Response) {
        return await view('auth.login', { 
            error: req.query('error'), 
            success: req.query('success') || req.query('message'), 
            email: req.query('email') || '' 
        });
    }

    /**
     * Handle an incoming authentication request.
     */
    public async login(req: Request, res: Response) {
        const { email, password } = await req.validate({
            email: 'required|email',
            password: 'required|string',
        });

        const credentials = { email, password };
        const result = await req.auth.attempt(credentials);

        if (!result) {
            Log.info('Failed login attempt', { email: credentials.email });
            return await view('auth.login', { 
                error: lang('auth.failed'),
                email: credentials.email 
            });
        }

        return res.redirect('/dashboard');
    }

    /**
     * Show the application dashboard.
     */
    public async showDashboard(req: Request, res: Response) {
        const user = await req.auth.user() as User | null;
        return await view('dashboard', { user: user || { name: 'User' } });
    }

    /**
     * Log the user out of the application.
     */
    public async logout(req: Request, res: Response) {
        await req.auth.logout();
        return res.redirect('/auth/login');
    }
}
`;
    }

    private getRegisterControllerStub() {
        return `import { Request, Response, Mail, Hasher, config, Log, app, view } from 'arikajs';
import { User } from '@Models/User';
import { VerifyEmail } from '@Mail/Auth/VerifyEmail';

export class RegisterController {
    public async showRegister(req: Request, res: Response) {
        return await view('auth.register', { error: null, success: null, old: {} });
    }

    public async register(req: Request, res: Response) {
        const { name, email, password } = await req.validate({
            name: 'required|string|min:2',
            email: 'required|email',
            password: 'required|string|min:8|confirmed',
        });

        const hashedPassword = await Hasher.make(password);
        const user = await User.create({ name, email, password: hashedPassword });

        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const verificationUrl = appUrl + '/auth/verify?email=' + encodeURIComponent(email) + '&token=' + Buffer.from(email).toString('base64');

        try {
            await Mail.to(email).send(new VerifyEmail(name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to send verification email', { error: (e as Error).message, email });
        }

        await req.auth.login(user);

        return await view('auth.register', { 
            success: 'Registration successful! You are now logged in.',
            user,
            old: {}
        });
    }
}`;
    }

    private getForgotPasswordControllerStub() {
        return `import { Request, Response, Mail, config, Log, lang, DB, view } from 'arikajs';
import { User } from '@Models/User';
import { ResetPassword } from '@Mail/Auth/ResetPassword';
import * as crypto from 'crypto';

export class ForgotPasswordController {
    /**
     * Show the form to request a password reset link.
     */
    public async showLinkRequestForm(req: Request, res: Response) {
        return await view('auth.passwords.email', { error: null, success: null });
    }

    /**
     * Send a reset link to the given user.
     */
    public async sendResetLinkEmail(req: Request, res: Response) {
        const { email } = await req.validate({
            email: 'required|email'
        });
        
        const user = await User.where('email', email).first() as User | null;

        if (!user) {
            return await view('auth.passwords.email', { 
                error: lang('auth.user_not_found'), 
                success: null 
            });
        }

        if (!user.email_verified_at) {
            return await view('auth.passwords.email', { 
                error: lang('auth.email_not_verified'), 
                success: null 
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        await DB.table('password_resets').where('email', email).delete();
        await DB.table('password_resets').insert({
            email,
            token,
            created_at: new Date()
        });

        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const resetUrl = appUrl + '/auth/password/reset/' + token + '?email=' + encodeURIComponent(email);
        try {
            await Mail.to(email).send(new ResetPassword(resetUrl, appName));
        } catch (e) {
            Log.error('Failed to send reset email', { error: (e as Error).message, email });
        }
        
        return await view('auth.passwords.email', { 
            success: lang('auth.reset_link_sent') 
        });
    }
}`;
    }

    private getResetPasswordControllerStub() {
        return `import { Request, Response, Hasher, lang, DB, view } from 'arikajs';
import { User } from '@Models/User';

export class ResetPasswordController {
    /**
     * Display the password reset view for the given token.
     */
    public async showResetForm(req: Request, res: Response) {
        return await view('auth.passwords.reset', { 
            token: req.param('token', ''),
            error: null 
        });
    }

    /**
     * Reset the given user's password.
     */
    public async reset(req: Request, res: Response) {
        const { email, password, token } = await req.validate({
            token: 'required|string',
            email: 'required|email',
            password: 'required|string|min:8|confirmed'
        });
        
        const resetRecord = await DB.table('password_resets').where('email', email).where('token', token).first();
        if (!resetRecord) {
            return await view('auth.passwords.reset', { 
                error: lang('auth.invalid_reset_token'),
                token 
            });
        }

        const user = await User.where('email', email).first() as User | null;
        if (!user) {
            return await view('auth.passwords.reset', { 
                error: lang('auth.user_not_found'),
                token 
            });
        }

        if (!user.email_verified_at) {
            return await view('auth.passwords.reset', { 
                error: lang('auth.email_not_verified'),
                token 
            });
        }

        await user.update({ password: await Hasher.make(password) });
        await DB.table('password_resets').where('email', email).delete();
        
        return res.redirect(\`/auth/login?success=\${encodeURIComponent(lang('auth.password_reset_success'))}\`);
    }
}
`;
    }

    private getVerifyEmailControllerStub() {
        return `import { Request, Response, Log, lang, Mail, config, app, view } from 'arikajs';
import { User } from '@Models/User';
import { VerifyEmail } from '@Mail/Auth/VerifyEmail';

export class VerifyEmailController {
    /**
     * Mark the authenticated user's email address as verified.
     */
    public async verify(req: Request, res: Response) {
        const { email, token } = req.all();

        if (!email || !token) {
            return res.redirect(\`/auth/login?error=\${encodeURIComponent(lang('auth.missing_verification_data'))}\`);
        }

        const expectedToken = Buffer.from(email).toString('base64');
        if (token !== expectedToken) {
            Log.warning('Invalid email verification attempt', { email, token });
            return res.redirect(\`/auth/login?error=\${encodeURIComponent(lang('auth.invalid_verification_token'))}\`);
        }

        const user = await User.where('email', email).first() as User | null;
        if (!user) {
            return res.redirect(\`/auth/login?error=\${encodeURIComponent(lang('auth.user_not_found'))}\`);
        }

        if (user.email_verified_at) {
            return res.redirect(\`/auth/login?success=\${encodeURIComponent(lang('auth.email_already_verified'))}&email=\${encodeURIComponent(email)}\`);
        }

        try {
            await user.update({
                email_verified_at: new Date()
            });
        } catch (e) {
            Log.error('Email verification update failed', { error: (e as Error).message, email });
            return res.redirect(\`/auth/login?error=\${encodeURIComponent(lang('auth.verification_failed'))}\`);
        }

        return res.redirect(\`/auth/login?success=\${encodeURIComponent(lang('auth.email_verified'))}&email=\${encodeURIComponent(email)}\`);
    }

    /**
     * Resend the email verification notification.
     */
    public async resend(req: Request, res: Response) {

        const user = await req.auth.user() as User | null;
        if (!user) {
            return res.redirect('/auth/login');
        }

        if (typeof user.hasVerifiedEmail === 'function' ? user.hasVerifiedEmail() : user.email_verified_at) {
            return res.redirect('/dashboard');
        }

        const appName = config('app.name', 'ArikaJS App');
        const appUrl = config('app.url', 'http://localhost:3000');
        const verificationUrl = appUrl + '/auth/verify?email=' + encodeURIComponent(user.email) + '&token=' + Buffer.from(user.email).toString('base64');

        try {
            await Mail.to(user.email).send(new VerifyEmail(user.name, verificationUrl, appName));
        } catch (e) {
            Log.error('Failed to send verification email', { error: (e as Error).message, email: user.email });
        }

        return res.redirect('/dashboard?success=' + encodeURIComponent('Verification link resent!'));
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
            .view('emails.auth.verify', {
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
            .view('emails.auth.reset', {
                reset_url: this.resetUrl,
                app_name: this.appName,
                year: new Date().getFullYear()
            });
    }
}
`;
    }

    private publishViews() {
        const cwd = process.cwd();
        const viewsDir = path.join(cwd, 'resources', 'views');
        const authViewsDir = path.join(viewsDir, 'auth');
        const passwordDir = path.join(authViewsDir, 'passwords');

        if (!fs.existsSync(passwordDir)) fs.mkdirSync(passwordDir, { recursive: true });

        fs.writeFileSync(path.join(authViewsDir, 'login.ark.html'), this.getLoginViewStub());
        fs.writeFileSync(path.join(authViewsDir, 'register.ark.html'), this.getRegisterViewStub());
        fs.writeFileSync(path.join(passwordDir, 'email.ark.html'), this.getForgotPasswordViewStub());
        fs.writeFileSync(path.join(passwordDir, 'reset.ark.html'), this.getResetPasswordViewStub());
        fs.writeFileSync(path.join(viewsDir, 'dashboard.ark.html'), this.getDashboardViewStub());

        // Email templates
        const emailDir = path.join(viewsDir, 'emails', 'auth');
        if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });
        fs.writeFileSync(path.join(emailDir, 'reset.ark.html'), this.getEmailTemplateStub());
        fs.writeFileSync(path.join(emailDir, 'verify.ark.html'), this.getVerifyEmailViewStub());
    }

    private appendWebRoutes() {
        const cwd = process.cwd();
        const routesPath = path.join(cwd, 'routes', 'web.ts');
        if (!fs.existsSync(routesPath)) return;

        let content = fs.readFileSync(routesPath, 'utf8');

        // Add imports if they don't exist
        const imports = [
            "import { LoginController } from '@Controllers/Auth/LoginController';",
            "import { RegisterController } from '@Controllers/Auth/RegisterController';",
            "import { ForgotPasswordController } from '@Controllers/Auth/ForgotPasswordController';",
            "import { ResetPasswordController } from '@Controllers/Auth/ResetPasswordController';",
            "import { VerifyEmailController } from '@Controllers/Auth/VerifyEmailController';"
        ];

        imports.forEach(imp => {
            if (!content.includes(imp)) {
                content = imp + "\n" + content;
            }
        });

        if (!content.includes("Route.group({ prefix: 'auth'")) {
            const routeDefinitions = `
// Authentication Routes (Web)
Route.group({ prefix: 'auth', middleware: 'web' }, () => {
    Route.get('/login', [LoginController, 'showLogin']).as('login');
    Route.post('/login', [LoginController, 'login']);
    Route.get('/register', [RegisterController, 'showRegister']);
    Route.post('/register', [RegisterController, 'register']);
    Route.post('/logout', [LoginController, 'logout']).withMiddleware('auth:web');

    // Password Reset
    Route.get('/password/reset', [ForgotPasswordController, 'showLinkRequestForm']);
    Route.post('/password/email', [ForgotPasswordController, 'sendResetLinkEmail']);
    Route.get('/password/reset/:token', [ResetPasswordController, 'showResetForm']);
    Route.post('/password/reset', [ResetPasswordController, 'reset']);

    // Email Verification
    Route.get('/verify', [VerifyEmailController, 'verify']);
    Route.post('/verification-notification', [VerifyEmailController, 'resend']).withMiddleware('auth:web');
});

Route.get('/dashboard', [LoginController, 'showDashboard']).withMiddleware('auth:web');
`;
            content += routeDefinitions;
        }

        fs.writeFileSync(routesPath, content);
    }

    private updateWelcomeHeader() {
        const cwd = process.cwd();
        const welcomePath = path.join(cwd, 'resources', 'views', 'welcome.ark.html');

        if (fs.existsSync(welcomePath)) {
            let content = fs.readFileSync(welcomePath, 'utf8');

            // Add CSS if not already present
            if (!content.includes('.auth-link')) {
                const css = `
        .auth-link {
            color: var(--text-main);
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95rem;
            transition: color 0.3s ease;
        }

        .auth-link:hover {
            color: var(--primary);
        }

        .auth-btn {
            background: var(--primary);
            color: white;
            padding: 0.6rem 1.5rem;
            border-radius: 99px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95rem;
            box-shadow: 0 4px 15px var(--primary-glow);
            transition: all 0.3s ease;
        }

        .auth-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--primary-glow);
            filter: brightness(1.1);
        }
    `;
                content = content.replace('</style>', `${css}\n    </style>`);
            }

            // Add Buttons if not already present
            if (!content.includes('/auth/login')) {
                const buttons = `
            <div class="auth-links" style="display: flex; gap: 1.5rem; align-items: center; margin-right: 0.5rem;">
                <a href="/auth/login" class="auth-link">Login</a>
                <a href="/auth/register" class="auth-btn">Register</a>
            </div>`;
                content = content.replace('<button class="theme-toggle"', `${buttons}\n            <button class="theme-toggle"`);
            }

            fs.writeFileSync(welcomePath, content);
        }
    }

    private getLoginViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - {{ config('app.name', 'ArikaJS') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <style>
        :root { --primary: #8b5cf6; --primary-glow: rgba(139, 92, 246, 0.4); --bg: #f8fafc; --text: #0f172a; --text-muted: #64748b; }
        * { box-sizing: border-box; transition: all 0.3s ease; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: var(--text); }
        .card { background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); width: 100%; max-width: 420px; border: 1px solid rgba(0,0,0,0.02); }
        .logo { width: 120px; margin-bottom: 2rem; }
        h1 { margin-bottom: 0.5rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
        p { color: var(--text-muted); margin-bottom: 2rem; font-weight: 400; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.9rem; }
        input { width: 100%; padding: 0.9rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 1rem; }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); filter: brightness(1.1); }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.95rem; color: var(--text-muted); }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 700; }
        .alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
        .alert-error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .alert-success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
        .forgot-link { display: block; text-align: right; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); text-decoration: none; }
        .forgot-link:hover { color: var(--primary); }
    </style>
</head>
<body>
    <div class="card">
        <a href="/"><img src="/assets/img/logo.png" alt="Logo" class="logo"></a>
        <h1>Welcome Back</h1>
        <p>Login to manage your application</p>

        @isset(error)
            <div class="alert alert-error">{{ error }}</div>
        @endisset

        @isset(success)
            <div class="alert alert-success">{{ success }}</div>
        @endisset

        <form action="/auth/login" method="POST">
            @csrf
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com" value="{{ email }}">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••">
                <a href="/auth/password/reset" class="forgot-link">Forgot Password?</a>
            </div>
            <button type="submit" class="btn">Sign In</button>
        </form>
        <div class="footer">
            Don't have an account? <a href="/auth/register">Create one</a>
        </div>
    </div>
</body>
</html>`;
    }

    private getRegisterViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - {{ config('app.name', 'ArikaJS') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <style>
        :root { --primary: #8b5cf6; --primary-glow: rgba(139, 92, 246, 0.4); --bg: #f8fafc; --text: #0f172a; --text-muted: #64748b; }
        * { box-sizing: border-box; transition: all 0.3s ease; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: var(--text); }
        .card { background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); width: 100%; max-width: 440px; border: 1px solid rgba(0,0,0,0.02); }
        .logo { width: 120px; margin-bottom: 2rem; }
        h1 { margin-bottom: 0.5rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
        p { color: var(--text-muted); margin-bottom: 2rem; font-weight: 400; }
        .form-group { margin-bottom: 1.2rem; }
        label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.9rem; }
        input { width: 100%; padding: 0.9rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 1rem; }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); filter: brightness(1.1); }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.95rem; color: var(--text-muted); }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 700; }
        .alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
        .alert-error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .alert-success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
    </style>
</head>
<body>
    <div class="card">
        <a href="/"><img src="/assets/img/logo.png" alt="Logo" class="logo"></a>
        <h1>Create Account</h1>
        <p>Join our premium platform</p>

        @isset(error)
            <div class="alert alert-error">{{ error }}</div>
        @endisset

        @isset(success)
            <div class="alert alert-success">{{ success }}</div>
        @endisset

        <form action="/auth/register" method="POST">
            @csrf
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required placeholder="John Doe" value="{{ old.name }}">
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com" value="{{ old.email }}">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" name="password_confirmation" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn">Register</button>
        </form>
        <div class="footer">
            Already have an account? <a href="/auth/login">Sign In</a>
        </div>
    </div>
</body>
</html>`;
    }

    private getForgotPasswordViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - {{ config('app.name', 'ArikaJS') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <style>
        :root { --primary: #8b5cf6; --primary-glow: rgba(139, 92, 246, 0.4); --bg: #f8fafc; --text: #0f172a; --text-muted: #64748b; }
        * { box-sizing: border-box; transition: all 0.3s ease; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: var(--text); }
        .card { background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); width: 100%; max-width: 420px; border: 1px solid rgba(0,0,0,0.02); }
        .logo { width: 120px; margin-bottom: 2rem; }
        h1 { margin-bottom: 0.5rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
        p { color: var(--text-muted); margin-bottom: 2rem; font-weight: 400; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.9rem; }
        input { width: 100%; padding: 0.9rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 1rem; }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); filter: brightness(1.1); }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.95rem; color: var(--text-muted); }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 700; }
        .alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
        .alert-error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .alert-success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
    </style>
</head>
<body>
    <div class="card">
        <a href="/"><img src="/assets/img/logo.png" alt="Logo" class="logo"></a>
        <h1>Reset Password</h1>
        <p>Enter your email to receive a reset link.</p>

        @isset(success)
            <div class="alert alert-success">{{ success }}</div>
        @endisset

        @isset(error)
            <div class="alert alert-error">{{ error }}</div>
        @endisset

        <form action="/auth/password/email" method="POST">
            @csrf
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com">
            </div>
            <button type="submit" class="btn">Send Reset Link</button>
        </form>
        <div class="footer">
            Remembered? <a href="/auth/login">Back to Sign In</a>
        </div>
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
    <title>Reset Password - {{ config('app.name', 'ArikaJS') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <style>
        :root { --primary: #8b5cf6; --primary-glow: rgba(139, 92, 246, 0.4); --bg: #f8fafc; --text: #0f172a; --text-muted: #64748b; }
        * { box-sizing: border-box; transition: all 0.3s ease; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; color: var(--text); }
        .card { background: white; padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); width: 100%; max-width: 420px; border: 1px solid rgba(0,0,0,0.02); }
        .logo { width: 120px; margin-bottom: 2rem; }
        h1 { margin-bottom: 0.5rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
        p { color: var(--text-muted); margin-bottom: 2rem; font-weight: 400; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.9rem; }
        input { width: 100%; padding: 0.9rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 1rem; }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); filter: brightness(1.1); }
        .alert { padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; font-size: 0.9rem; }
        .alert-error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    </style>
</head>
<body>
    <div class="card">
        <a href="/"><img src="/assets/img/logo.png" alt="Logo" class="logo"></a>
        <h1>Set New Password</h1>
        <p>Secure your account with a new password.</p>

        @isset(error)
            <div class="alert alert-error">{{ error }}</div>
        @endisset

        <form action="/auth/password/reset" method="POST">
            @csrf
            <input type="hidden" name="token" value="{{ token }}">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>New Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" name="password_confirmation" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn">Reset Password</button>
        </form>
    </div>
</body>
</html>`;
    }

    private getDashboardViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - {{ config('app.name', 'ArikaJS') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <style>
        :root { --primary: #8b5cf6; --bg: #f8fafc; --text: #0f172a; --text-muted: #64748b; }
        body { font-family: 'Outfit', sans-serif; margin: 0; background: var(--bg); color: var(--text); }
        nav { background: white; padding: 1.2rem 5%; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.01); }
        .logo-container { display: flex; align-items: center; text-decoration: none; }
        .logo { width: 120px; height: auto; transition: filter 0.3s; }
        .logo:hover { filter: brightness(1.1); }
        .logout-btn { color: #ef4444; background: none; border: 1px solid rgba(239, 68, 68, 0.1); padding: 0.6rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; }
        .logout-btn:hover { background: #fee2e2; }
        main { padding: 4rem 5%; max-width: 1200px; margin: 0 auto; }
        .welcome-card { background: white; padding: 4rem; border-radius: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02); text-align: center; position: relative; overflow: hidden; }
        .welcome-card h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 800; }
        .welcome-card p { font-size: 1.2rem; color: var(--text-muted); max-width: 600px; margin: 0 auto; line-height: 1.6; }
        .aurora { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 60%); z-index: -1; animation: rotate 20s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo-container">
            <img src="/assets/img/logo.png" alt="ArikaJS Logo" class="logo">
        </a>
        <form action="/auth/logout" method="POST" style="margin: 0;">
            @csrf
            <button type="submit" class="logout-btn">Sign Out</button>
        </form>
    </nav>
    <main>
        <div class="welcome-card">
            <div class="aurora"></div>
            <h1>Hello, {{ user.name }}!</h1>
            <p>Welcome to your premium application dashboard. You have successfully authenticated using the ArikaJS Next-Gen Authentication system.</p>
            
            @if(!user.email_verified_at)
            <div style="margin-top: 2.5rem; padding: 1.5rem; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; color: #b45309; text-align: left;">
                <h3 style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.2rem;">Email Not Verified</h3>
                <p style="margin-bottom: 1.5rem; color: #92400e; font-size: 0.95rem;">Please verify your email address to access all features. Didn't receive the email?</p>
                <form action="/auth/verify/resend" method="POST" style="margin: 0;">
                    @csrf
                    <button type="submit" style="background: #f59e0b; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);">
                        Resend Verification Link
                    </button>
                </form>
            </div>
            @endif
        </div>
    </main>
</body>
</html>`;
    }

    private getEmailTemplateStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - {{ config('app.name', 'ArikaJS') }}</title>
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

    private getVerifyEmailViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - {{ config('app.name', 'ArikaJS') }}</title>
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
        <div class="footer">&copy; {{ year }} {{ app_name }}. All rights reserved.</div>
    </div>
</body>
</html>`;
    }

    private getAuthTranslationStub() {
        return `{
    "failed": "These credentials do not match our records.",
    "password": "The provided password is incorrect.",
    "throttle": "Too many login attempts. Please try again in :seconds seconds.",
    "email_verified": "Your email has been successfully verified! Please sign in to continue.",
    "email_already_verified": "Your email is already verified. Please sign in.",
    "user_not_found": "We can't find a user with that email address.",
    "missing_verification_data": "Verification data is missing from the request.",
    "invalid_verification_token": "The verification token is invalid.",
    "verification_failed": "Something went wrong during the verification process.",
    "verification_resent": "A new verification link has been sent to your email address.",
    "reset_link_sent": "We have emailed your password reset link!",
    "password_reset_success": "Your password has been reset!",
    "invalid_reset_token": "This password reset token is invalid.",
    "email_not_verified": "Your email address is not verified. Please verify your email before attempting to reset your password."
}`;
    }

    private publishTranslations() {
        const cwd = process.cwd();
        const langDir = path.join(cwd, 'resources', 'lang', 'en');
        if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
        fs.writeFileSync(path.join(langDir, 'auth.json'), this.getAuthTranslationStub());
    }
}
