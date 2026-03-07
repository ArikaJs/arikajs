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
        const modelPath = path.join(cwd, 'app', 'Models', 'User.ts');
        const authControllerDir = path.join(cwd, 'app', 'Http', 'Controllers', 'Auth');
        const middlewarePath = path.join(cwd, 'app', 'Http', 'Middleware', 'Authenticate.ts');

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
            migrationDir
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
        this.registerMiddleware();
        this.updateWelcomeHeader();

        this.writeln('');
        this.success('Premium Web Authentication scaffolding generated successfully!');
    }

    private getConfigStub() {
        return `import { User } from '../app/Models/User';

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
        return `import { Request, Response, Log, lang } from 'arikajs';

export class LoginController {
    /**
     * Show the application's login form.
     */
    public async showLogin({ view }: any) {
        return view.render('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public async login(req: Request, res: Response) {
        const credentials = req.only(['email', 'password']);
        const result = await (req as any).auth.attempt(credentials);

        if (!result) {
            Log.info('Failed login attempt', { email: credentials.email });
            return res.json({ error: lang('auth.failed') }, 401);
        }

        return res.json({ 
            message: lang('auth.login_success'), 
            user: await (req as any).auth.user() 
        });
    }

    /**
     * Show the application dashboard.
     */
    public async showDashboard({ view, request }: any) {
        const user = await request.auth.user();
        return view.render('dashboard', { user: user || { name: 'User' } });
    }

    /**
     * Log the user out of the application.
     */
    public async logout(req: Request, res: Response) {
        await (req as any).auth.logout();
        return res.redirect('/auth/login');
    }
}
`;
    }

    private getRegisterControllerStub() {
        return 'import { Request, Response, Validator, Mail, Hasher, config, Log } from \'arikajs\';\n' +
            'import { User } from \'../../../Models/User\';\n' +
            'import { VerifyEmail } from \'../../../Mail/Auth/VerifyEmail\';\n\n' +
            'export class RegisterController {\n' +
            '    public async showRegister({ view }: any) {\n' +
            '        return view.render(\'auth.register\');\n' +
            '    }\n\n' +
            '    public async register(req: Request, res: Response) {\n' +
            '        const validator = new Validator(req.all(), {\n' +
            '            name: \'required|string|min:2\',\n' +
            '            email: \'required|email\',\n' +
            '            password: \'required|string|min:8|confirmed\',\n' +
            '        });\n\n' +
            '        if (await validator.fails()) {\n' +
            '            return res.json({ error: \'Validation failed\', messages: validator.errors() }, 422);\n' +
            '        }\n\n' +
            '        const { name, email, password } = validator.validated();\n' +
            '        const hashedPassword = await Hasher.make(password);\n' +
            '        const user = await (User as any).create({ name, email, password: hashedPassword });\n\n' +
            '        const appName = config(\'app.name\', \'ArikaJS App\');\n' +
            '        const appUrl = config(\'app.url\', \'http://localhost:3000\');\n' +
            '        const verificationUrl = \`${appUrl}/auth/verify?email=\${encodeURIComponent(email)}&token=\${Buffer.from(email).toString(\'base64\')}\`;\n\n' +
            '        try {\n' +
            '            await Mail.to(email).send(new VerifyEmail(name, verificationUrl, appName));\n' +
            '        } catch (e) {\n' +
            '            Log.error(\'Failed to send verification email\', { error: (e as Error).message, email });\n' +
            '        }\n\n' +
            '        await (req as any).auth.login(user);\n\n' +
            '        return res.json({ message: \'Registration successful\', user });\n' +
            '    }\n' +
            '}';
    }

    private getForgotPasswordControllerStub() {
        return 'import { Request, Response, Validator, Mail, config, Log, lang, DB } from \'arikajs\';\n' +
            'import { User } from \'../../../Models/User\';\n' +
            'import { ResetPassword } from \'../../../Mail/Auth/ResetPassword\';\n' +
            'import * as crypto from \'crypto\';\n\n' +
            'export class ForgotPasswordController {\n' +
            '    /**\n' +
            '     * Show the form to request a password reset link.\n' +
            '     */\n' +
            '    public async showLinkRequestForm({ view }: any) {\n' +
            '        return view.render(\'auth.passwords.email\');\n' +
            '    }\n\n' +
            '    /**\n' +
            '     * Send a reset link to the given user.\n' +
            '     */\n' +
            '    public async sendResetLinkEmail(req: Request, res: Response) {\n' +
            '        const { email } = req.all();\n' +
            '        const user = await User.where(\'email\', email).first();\n\n' +
            '        if (user) {\n' +
            '            const token = crypto.randomBytes(32).toString(\'hex\');\n' +
            '            await DB.table(\'password_resets\').where(\'email\', email).delete();\n' +
            '            await DB.table(\'password_resets\').insert({\n' +
            '                email,\n' +
            '                token,\n' +
            '                created_at: new Date()\n' +
            '            });\n\n' +
            '            const appName = config(\'app.name\', \'ArikaJS App\');\n' +
            '            const appUrl = config(\'app.url\', \'http://localhost:3000\');\n' +
            '            const resetUrl = `${appUrl}/auth/password/reset/${token}?email=${encodeURIComponent(email)}`;\n' +
            '            try {\n' +
            '                await Mail.to(email).send(new ResetPassword(resetUrl, appName));\n' +
            '            } catch (e) {\n' +
            '                Log.error(\'Failed to send reset email\', { error: (e as Error).message, email });\n' +
            '            }\n' +
            '        }\n' +
            '        return res.json({ message: lang(\'auth.reset_link_sent\') });\n' +
            '    }\n' +
            '}';
    }

    private getResetPasswordControllerStub() {
        return `import { Request, Response, Validator, Hasher, lang, DB } from 'arikajs';
import { User } from '../../../Models/User';

export class ResetPasswordController {
    /**
     * Display the password reset view for the given token.
     */
    public async showResetForm({ view, request }: any) {
        return view.render('auth.passwords.reset', { token: request.params.token });
    }

    /**
     * Reset the given user's password.
     */
    public async reset(req: Request, res: Response) {
        const { email, password, token } = req.all();
        
        // Let's add validation to ensure they match
        if (!token || !email || !password) {
            return res.json({ error: lang('validation.failed') }, 422);
        }

        const resetRecord = await DB.table('password_resets').where('email', email).where('token', token).first();
        if (!resetRecord) {
            return res.json({ error: lang('auth.invalid_reset_token') }, 403);
        }

        const user = await User.where('email', email).first() as any;
        if (user) {
            await user.update({ password: await Hasher.make(password) });
            await DB.table('password_resets').where('email', email).delete();
        }
        
        return res.json({ message: lang('auth.password_reset_success') });
    }
}
`;
    }

    private getVerifyEmailControllerStub() {
        return `import { Request, Response, Log, lang } from 'arikajs';
import { User } from '../../../Models/User';

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

        return res.json({ 
            message: lang('auth.email_verified') 
        });
    }

    /**
     * Resend the email verification notification.
     */
    public async resend(req: Request, res: Response) {
        return res.json({ message: lang('auth.verification_resent') });
    }
}
`;
    }

    private getVerifyEmailMailableStub() {
        return `import { Mailable } from 'arikajs';

export class VerifyEmail extends Mailable {
    constructor(private name: string, private verificationUrl: string, private appName: string) { super(); }
    public build() {
        return this.subject('Verify Email').view('emails.auth.verify', { name: this.name, url: this.verificationUrl, app: this.appName });
    }
}
`;
    }

    private getResetPasswordMailableStub() {
        return `import { Mailable } from 'arikajs';

export class ResetPassword extends Mailable {
    constructor(private resetUrl: string, private appName: string) { super(); }
    public build() {
        return this.subject('Reset Password').view('emails.auth.reset', { url: this.resetUrl, app: this.appName });
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
        return response.redirect('/auth/login');
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
        fs.writeFileSync(path.join(emailDir, 'reset_password.ark.html'), this.getEmailTemplateStub());
        fs.writeFileSync(path.join(emailDir, 'verify_email.ark.html'), this.getVerifyEmailViewStub());
    }

    private appendWebRoutes() {
        const cwd = process.cwd();
        const routesPath = path.join(cwd, 'routes', 'web.ts');
        if (!fs.existsSync(routesPath)) return;

        let content = fs.readFileSync(routesPath, 'utf8');

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
// Authentication Routes (Web)
Route.group({ prefix: 'auth' }, () => {
    Route.get('/login', [LoginController, 'showLogin']).name('login');
    Route.post('/login', [LoginController, 'login']);
    Route.get('/register', [RegisterController, 'showRegister']);
    Route.post('/register', [RegisterController, 'register']);
    Route.post('/logout', [LoginController, 'logout']).name('logout');

    // Password Reset
    Route.get('/password/reset', [ForgotPasswordController, 'showLinkRequestForm']);
    Route.post('/password/email', [ForgotPasswordController, 'sendResetLinkEmail']);
    Route.get('/password/reset/:token', [ResetPasswordController, 'showResetForm']);
    Route.post('/password/reset', [ResetPasswordController, 'reset']);

    // Email Verification
    Route.get('/verify', [VerifyEmailController, 'verify']);
});

Route.get('/dashboard', [LoginController, 'showDashboard']).withMiddleware('auth');
`;
            content += routeDefinitions;
        }

        fs.writeFileSync(routesPath, content);
    }

    private registerMiddleware() {
        const cwd = process.cwd();
        const kernelPath = path.join(cwd, 'app', 'Http', 'Kernel.ts');
        if (fs.existsSync(kernelPath)) {
            let content = fs.readFileSync(kernelPath, 'utf8');
            const authRegistration = "'auth': Authenticate,";

            if (!content.includes("import { Authenticate } from './Middleware/Authenticate'")) {
                content = "import { Authenticate } from './Middleware/Authenticate';\n" + content;
            }

            // Case 1: Already registered (uncommented)
            if (content.includes(authRegistration) && !content.includes(`// ${authRegistration}`)) {
                // Already there and active
            }
            // Case 2: Commented out line
            else if (content.includes(`// ${authRegistration}`)) {
                content = content.replace(`// ${authRegistration}`, authRegistration);
            }
            // Case 3: Standard property declaration (legacy templates)
            else if (content.includes('protected routeMiddleware = {')) {
                content = content.replace(
                    'protected routeMiddleware = {',
                    `protected routeMiddleware = {\n        ${authRegistration}`
                );
            }
            // Case 4: General object assignment or declaration
            else if (content.includes('routeMiddleware = {') && !content.includes("'auth'")) {
                content = content.replace('routeMiddleware = {', `routeMiddleware = {\n        ${authRegistration}`);
            }
            fs.writeFileSync(kernelPath, content);
        }
    }

    private updateWelcomeHeader() { }

    private getLoginViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ArikaJS</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #5d5bd4; --bg: #f4f7fe; --text: #1b1b1b; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
        h1 { margin-bottom: 0.5rem; font-size: 1.8rem; }
        p { color: #888; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.2rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        input { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .btn:hover { background: #4a48c0; }
        .footer { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome Back</h1>
        <p>Login to manage your application</p>
        <form action="/auth/login" method="POST">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <button type="submit" class="btn">Sign In</button>
        </form>
        <div class="footer">
            Don't have an account? <a href="/auth/register">Register</a>
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
    <title>Register - ArikaJS</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #5d5bd4; --bg: #f4f7fe; --text: #1b1b1b; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
        h1 { margin-bottom: 0.5rem; font-size: 1.8rem; }
        p { color: #888; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.2rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
        input { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        .btn { background: var(--primary); color: white; border: none; padding: 1rem; width: 100%; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .btn:hover { background: #4a48c0; }
        .footer { margin-top: 1.5rem; text-align: center; font-size: 0.9rem; }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Create Account</h1>
        <p>Join our premium platform</p>
        <form action="/auth/register" method="POST">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required placeholder="John Doe">
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" required placeholder="email@example.com">
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
            Already have an account? <a href="/auth/login">Login</a>
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
    <title>Forgot Password - ArikaJS</title>
    <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; }
        .card { background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); width: 350px; }
        .btn { background: #5d5bd4; color: white; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Forgot Password?</h2>
        <p>Enter your email to receive a reset link.</p>
        <form action="/auth/password/email" method="POST">
            <input type="email" name="email" placeholder="Your Email" style="width: 100%; padding: 10px; margin-bottom: 15px;" required>
            <button type="submit" class="btn">Send Reset Link</button>
        </form>
    </div>
</body>
</html>`;
    }

    private getResetPasswordViewStub() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password - ArikaJS</title>
</head>
<body>
    <div style="max-width: 400px; margin: 100px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2>Reset Your Password</h2>
        <form action="/auth/password/reset" method="POST">
            <input type="hidden" name="token" value="{{ token }}">
            <div style="margin-bottom: 15px;">
                <label>Email</label><br>
                <input type="email" name="email" required style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
                <label>New Password</label><br>
                <input type="password" name="password" required style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
                <label>Confirm Password</label><br>
                <input type="password" name="password_confirmation" required style="width: 100%;">
            </div>
            <button type="submit" style="background: #5d5bd4; color: white; border: none; padding: 10px 20px; border-radius: 5px;">Reset Password</button>
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
    <title>Dashboard - ArikaJS</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; margin: 0; background: #f8fafc; }
        nav { background: white; padding: 1rem 5%; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .logout-link { color: #ef4444; text-decoration: none; font-weight: 600; }
        main { padding: 3rem 5%; }
        .welcome-card { background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    </style>
</head>
<body>
    <nav>
        <div style="font-weight: 800; font-size: 1.2rem; color: #5d5bd4;">ArikaJS</div>
        <form action="/auth/logout" method="POST" style="margin: 0;">
            <button type="submit" class="logout-link" style="background: none; border: none; cursor: pointer; font-size: 1rem;">Logout</button>
        </form>
    </nav>
    <main>
        <div class="welcome-card">
            <h1>Hello, {{ user.name }}!</h1>
            <p>Welcome to your premium dashboard. You are successfully authenticated.</p>
        </div>
    </main>
</body>
</html>`;
    }

    private getEmailTemplateStub() {
        return `<!DOCTYPE html>
<html>
<body>
    <h2>Password Reset</h2>
    <p>You are receiving this email because we received a password reset request for your account.</p>
    <p><a href="{{ url }}">Reset Password</a></p>
    <p>If you did not request a password reset, no further action is required.</p>
</body>
</html>`;
    }

    private getVerifyEmailViewStub() {
        return `<!DOCTYPE html>
<html>
<body>
    <h2>Verify Email</h2>
    <p>Please click the button below to verify your email address.</p>
    <p><a href="{{ url }}">Verify Email</a></p>
</body>
</html>`;
    }
}
