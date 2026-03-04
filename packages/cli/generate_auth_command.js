const fs = require('fs');
const path = require('path');

const content = \`import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class AuthInstallCommand extends Command {
    public signature = 'auth:install {--force}';
    public description = 'Scaffold basic authentication views and routes';

    public async handle() {
        this.info('Scaffolding authentication system...');

        const force = this.option('force');
        const cwd = process.cwd();

        // Target Paths
        const configPath = path.join(cwd, 'config', 'auth.ts');
        const modelPath = path.join(cwd, 'app', 'Models', 'User.ts');
        const authControllerDir = path.join(cwd, 'app', 'Http', 'Controllers', 'Auth');
        const middlewarePath = path.join(cwd, 'app', 'Http', 'Middleware', 'AuthMiddleware.ts');

        // Generate timestamped migration name
        const date = new Date();
        const timestamp = date.getFullYear().toString() + '_' +
            (date.getMonth() + 1).toString().padStart(2, '0') + '_' +
            date.getDate().toString().padStart(2, '0') + '_' +
            date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');
        const migrationDir = path.join(cwd, 'database', 'migrations');
        const migrationPath = path.join(migrationDir, \\\`\${timestamp}_create_users_table.ts\\\`);

        // Check if any file exists unless --force is used
        if (!force) {
            const existingFiles = [configPath, modelPath, middlewarePath]
                .filter(p => fs.existsSync(p));

            if (existingFiles.length > 0) {
                this.error('Authentication scaffold failed. The following files already exist:');
                existingFiles.forEach(f => this.writeln(\\\`  - \${f}\\\`));
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

        // Check if users migration already exists
        const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
        const hasUsersMigration = migrations.some(file => file.includes('create_users_table'));

        if (!hasUsersMigration) {
            fs.writeFileSync(migrationPath, this.getMigrationStub());
        }

        // Update Routes and Views
        this.appendRoutes();
        this.publishViews();
        this.appendWebRoutes();
        this.updateWelcomeHeader();

        this.success('Premium Authentication scaffolding generated successfully!');
        this.info('\\\\nNext steps:');
        this.info('1. Run: npm install bcryptjs jsonwebtoken');
        this.info('2. Run: npm install -D @types/bcryptjs @types/jsonwebtoken');
        this.info('3. Run your migrations: arika migrate');
    }

    private getConfigStub() {
        return \\\`export default {
    defaults: {
        guard: 'api',
    },
    guards: {
        api: {
            driver: 'jwt',
            provider: 'users',
        },
    },
    providers: {
        users: {
            driver: 'eloquent',
            model: 'app/Models/User',
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        ttl: 60 * 24, // 24 hours in minutes
    }
};
\\\`;
    }

    private getModelStub() {
        return \\\`import { Model } from 'arikajs';

export class User extends Model {
    protected static table = 'users';

    protected fillable: string[] = [
        'name',
        'email',
        'password',
    ];

    protected hidden: string[] = [
        'password',
    ];
}
\\\`;
    }

    private getMigrationStub() {
        return \\\`import { Migration, SchemaBuilder } from 'arikajs';

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
\\\`;
    }

    private getLoginControllerStub() {
        return \\\`import { Request, Response, config } from 'arikajs';
import { User } from '../../Models/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export class LoginController {
    public async showLogin({ view }: any) {
        return view.render('auth.login');
    }

    public async login(req: Request, res: Response) {
        const email = req.input('email');
        const password = req.input('password');

        if (!email || !password) {
            return res.json({ error: 'Email and password are required' }, 400);
        }

        const user = await User.where('email', email).first();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.json({ error: 'Invalid credentials' }, 401);
        }

        return this.issueToken(user, res);
    }

    public async showDashboard({ view }: any) {
        return view.render('dashboard');
    }

    public async me(req: Request, res: Response) {
        return res.json({ user: (req as any).user });
    }

    private issueToken(user: any, res: Response) {
        const secret = config('auth.jwt.secret', 'your-super-secret-jwt-key');
        const ttl = config('auth.jwt.ttl', 1440);
        
        const payload = { sub: user.id, email: user.email };
        const token = jwt.sign(payload, secret, { expiresIn: ttl * 60 });

        const userObj = { ...user };
        delete userObj.password;

        return res.json({
            access_token: token,
            token_type: 'bearer',
            expires_in: ttl * 60,
            user: userObj
        });
    }
}
\\\`;
    }

    private getRegisterControllerStub() {
        return \\\`import { Request, Response, config } from 'arikajs';
import { User } from '../../Models/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export class RegisterController {
    public async showRegister({ view }: any) {
        return view.render('auth.register');
    }

    public async register(req: Request, res: Response) {
        const { name, email, password } = req.all();

        if (!name || !email || !password) {
            return res.json({ error: 'All fields are required' }, 400);
        }

        const existingUser = await User.where('email', email).first();
        if (existingUser) {
            return res.json({ error: 'Email is already in use' }, 409);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await (User as any).create({
            name,
            email,
            password: hashedPassword
        });

        const secret = config('auth.jwt.secret', 'your-super-secret-jwt-key');
        const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '24h' });

        return res.json({ access_token: token, user });
    }
}
\\\`;
    }

    private getForgotPasswordControllerStub() {
        return \\\`import { Request, Response } from 'arikajs';

export class ForgotPasswordController {
    public async showLinkRequestForm({ view }: any) {
        return view.render('auth.passwords.email');
    }

    public async sendResetLinkEmail(req: Request, res: Response) {
        const email = req.input('email');
        if (!email) return res.json({ error: 'Email is required' }, 400);
        
        console.log(\\\`Generating reset link for \${email}\\\`);
        
        return res.json({ message: 'If your email is in our system, you will receive a reset link shortly.' });
    }
}
\\\`;
    }

    private getResetPasswordControllerStub() {
        return \\\`import { Request, Response } from 'arikajs';

export class ResetPasswordController {
    public async showResetForm({ view, request }: any) {
        const token = request.query('token');
        return view.render('auth.passwords.reset', { token });
    }

    public async reset(req: Request, res: Response) {
        const { token, email, password } = req.all();
        if (!token || !email || !password) {
            return res.json({ error: 'All fields are required' }, 400);
        }
        
        // Logic to verify token and update user password
        return res.json({ message: 'Your password has been reset successfully.' });
    }
}
\\\`;
    }

    private getMiddlewareStub() {
        return \\\`import { Request, Response, config } from 'arikajs';
import * as jwt from 'jsonwebtoken';
import { User } from '../../Models/User';

export class AuthMiddleware {
    public async handle(req: Request, res: Response, next: Function) {
        const authHeader = req.header('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ error: 'Unauthenticated.' }, 401);
        }

        const token = authHeader.split(' ')[1];
        const secret = config('auth.jwt.secret', 'your-super-secret-jwt-key');

        try {
            const decoded: any = jwt.verify(token, secret);
            const user = await User.find(decoded.sub);
            
            if (!user) {
                return res.json({ error: 'User associated with this token no longer exists.' }, 401);
            }

            delete (user as any).password;
            (req as any).user = user;

            await next();
        } catch (error) {
            return res.json({ error: 'Token is invalid or has expired.' }, 401);
        }
    }
}
\\\`;
    }

    private appendRoutes() {
        const cwd = process.cwd();
        const apiRoutesPath = path.join(cwd, 'routes', 'api.ts');
        if (!fs.existsSync(apiRoutesPath)) return;

        let content = fs.readFileSync(apiRoutesPath, 'utf8');
        if (content.includes('Auth/LoginController')) return;

        const importStatement = \\\`import { LoginController } from '../app/Http/Controllers/Auth/LoginController';
import { RegisterController } from '../app/Http/Controllers/Auth/RegisterController';\\\\n\\\`;
        content = importStatement + content;

        const routeDefinitions = \\\`
// Authentication Routes
Route.group({ prefix: 'auth' }, () => {
    Route.post('/register', [RegisterController, 'register']);
    Route.post('/login', [LoginController, 'login']);
});
Route.get('/user', [LoginController, 'me']).withMiddleware('auth');
\\\`;
        content += routeDefinitions;
        fs.writeFileSync(apiRoutesPath, content);
    }

    private publishViews() {
        const cwd = process.cwd();
        const viewsDir = path.join(cwd, 'resources', 'views');
        const authViewsDir = path.join(viewsDir, 'auth');
        const passwordDir = path.join(authViewsDir, 'passwords');

        if (!fs.existsSync(passwordDir)) fs.mkdirSync(passwordDir, { recursive: true });

        fs.writeFileSync(path.join(authViewsDir, 'login.html'), this.getLoginViewStub());
        fs.writeFileSync(path.join(authViewsDir, 'register.html'), this.getRegisterViewStub());
        fs.writeFileSync(path.join(passwordDir, 'email.html'), this.getForgotPasswordViewStub());
        fs.writeFileSync(path.join(passwordDir, 'reset.html'), this.getResetPasswordViewStub());
        fs.writeFileSync(path.join(viewsDir, 'dashboard.html'), this.getDashboardViewStub());

        // Email templates
        const emailDir = path.join(viewsDir, 'emails', 'auth');
        if (!fs.existsSync(emailDir)) fs.mkdirSync(emailDir, { recursive: true });
        fs.writeFileSync(path.join(emailDir, 'reset_password.html'), this.getEmailTemplateStub());
    }

    private appendWebRoutes() {
        const cwd = process.cwd();
        const webRoutesPath = path.join(cwd, 'routes', 'web.ts');
        if (!fs.existsSync(webRoutesPath)) return;

        let content = fs.readFileSync(webRoutesPath, 'utf8');
        if (content.includes('Auth/LoginController')) return;

        const importStatement = \\\`import { LoginController } from '../app/Http/Controllers/Auth/LoginController';
import { RegisterController } from '../app/Http/Controllers/Auth/RegisterController';
import { ForgotPasswordController } from '../app/Http/Controllers/Auth/ForgotPasswordController';
import { ResetPasswordController } from '../app/Http/Controllers/Auth/ResetPasswordController';\\\\n\\\`;
        content = importStatement + content;

        const routeDefinitions = \\\`
// Authentication Routes (Web)
Route.group({ prefix: 'auth' }, () => {
    Route.get('/login', [LoginController, 'showLogin']);
    Route.get('/register', [RegisterController, 'showRegister']);
    Route.get('/password/reset', [ForgotPasswordController, 'showLinkRequestForm']);
    Route.get('/password/reset/:token', [ResetPasswordController, 'showResetForm']);
});
Route.get('/dashboard', [LoginController, 'showDashboard']);
\\\`;
        content += routeDefinitions;
        fs.writeFileSync(webRoutesPath, content);
    }

    private updateWelcomeHeader() {
        const cwd = process.cwd();
        const welcomePath = path.join(cwd, 'resources', 'views', 'welcome.html');
        if (!fs.existsSync(welcomePath)) return;

        let content = fs.readFileSync(welcomePath, 'utf8');
        const navHtml = \\\`
            <a href="/auth/login" style="text-decoration: none; color: var(--text-main); font-weight: 600; font-size: 0.95rem; transition: color 0.2s;">Login</a>
            <a href="/auth/register" style="text-decoration: none; background: var(--primary); color: white; padding: 0.6rem 1.2rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 15px var(--primary-glow);">Register</a>\\\`;

        if (content.includes('class="header-right"')) {
            content = content.replace('class="header-right" style="display: flex; align-items: center; gap: 1.5rem;">', 'class="header-right" style="display: flex; align-items: center; gap: 1.5rem;">' + navHtml);
        }
        fs.writeFileSync(welcomePath, content);
    }

    private getLoginViewStub() {
        return \\\`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ArikaJS</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #8b5cf6;
            --primary-glow: rgba(139, 92, 246, 0.4);
            --bg: #f8fafc;
            --card-bg: rgba(255, 255, 255, 0.9);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: rgba(15, 23, 42, 0.08);
        }
        [data-theme="dark"] {
            --bg: #030712;
            --card-bg: rgba(17, 24, 39, 0.8);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg); color: var(--text-main); height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card { background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid var(--border); padding: 3rem; border-radius: 32px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        h1 { font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center; }
        p { color: var(--text-muted); text-align: center; margin-bottom: 2.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main); }
        input { width: 100%; padding: 0.875rem 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; font-size: 1rem; transition: all 0.2s; color: var(--text-main); }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: 1rem; box-shadow: 0 10px 15px -3px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -5px var(--primary-glow); background: #9d71fd; }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
        .error-message { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.75rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.875rem; display: none; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2); }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome Back</h1>
        <p>Sign in to your ArikaJS application</p>
        <div id="error" class="error-message"></div>
        <form id="loginForm">
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="email" placeholder="name@example.com" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn" id="submitBtn">Sign In</button>
        </form>
        <div class="footer">
            Don't have an account? <a href="/auth/register">Create one</a><br><br>
            <a href="/auth/password/reset" style="font-weight: 400; font-size: 0.8rem;">Forgot password?</a>
        </div>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('error');
            const submitBtn = document.getElementById('submitBtn');

            errorEl.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('arika_token', data.access_token);
                    localStorage.setItem('arika_user', JSON.stringify(data.user));
                    window.location.href = '/dashboard';
                } else {
                    errorEl.textContent = data.error || 'Login failed';
                    errorEl.style.display = 'block';
                }
            } catch (err) {
                errorEl.textContent = 'Server connection failed';
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    </script>
</body>
</html>\\\`;
    }

    private getRegisterViewStub() {
        return \\\`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - ArikaJS</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #8b5cf6;
            --primary-glow: rgba(139, 92, 246, 0.4);
            --bg: #f8fafc;
            --card-bg: rgba(255, 255, 255, 0.9);
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: rgba(15, 23, 42, 0.08);
        }
        [data-theme="dark"] {
            --bg: #030712;
            --card-bg: rgba(17, 24, 39, 0.8);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg); color: var(--text-main); height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card { background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid var(--border); padding: 3rem; border-radius: 32px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        h1 { font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center; }
        p { color: var(--text-muted); text-align: center; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.25rem; }
        label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main); }
        input { width: 100%; padding: 0.875rem 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; font-size: 1rem; transition: all 0.2s; color: var(--text-main); }
        input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
        .btn { width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: 1rem; box-shadow: 0 10px 15px -3px var(--primary-glow); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -5px var(--primary-glow); background: #9d71fd; }
        .footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
        .footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
        .error-message { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.75rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.875rem; display: none; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2); }
    </style>
</head>
<body>
    <div class="card">
        <h1>Create Account</h1>
        <p>Join the next generation of builders</p>
        <div id="error" class="error-message"></div>
        <form id="registerForm">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="name" placeholder="John Doe" required>
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="email" placeholder="name@example.com" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn" id="submitBtn">Register Now</button>
        </form>
        <div class="footer">
            Already have an account? <a href="/auth/login">Sign in</a>
        </div>
    </div>
    <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('error');
            const submitBtn = document.getElementById('submitBtn');

            errorEl.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('arika_token', data.access_token);
                    localStorage.setItem('arika_user', JSON.stringify(data.user));
                    window.location.href = '/dashboard';
                } else {
                    errorEl.textContent = data.error || 'Registration failed';
                    errorEl.style.display = 'block';
                }
            } catch (err) {
                errorEl.textContent = 'Server connection failed';
                errorEl.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Now';
            }
        });
    </script>
</body>
</html>\\\`;
    }

    private getForgotPasswordViewStub() {
        return \\\`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forgot Password - ArikaJS</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&display=swap" rel="stylesheet">
    <style>
        body { background: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .card { background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
        h1 { font-family: 'Outfit', sans-serif; margin-bottom: 1rem; }
        input { width: 100%; padding: 0.75rem; margin: 1rem 0; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        .btn { background: #8b5cf6; color: white; padding: 0.75rem; width: 100%; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Forgot Password?</h1>
        <p>No worries, we'll send you reset instructions.</p>
        <form onsubmit="event.preventDefault(); alert('Link sent!');">
            <input type="email" placeholder="Enter your email" required>
            <button class="btn">Send Link</button>
        </form>
        <p style="margin-top: 1.5rem; text-align: center;"><a href="/auth/login" style="color: #8b5cf6;">Back to login</a></p>
    </div>
</body>
</html>\\\`;
    }

    private getResetPasswordViewStub() {
        return \\\`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password - ArikaJS</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;800&display=swap" rel="stylesheet">
    <style>
        body { background: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .card { background: white; padding: 2.5rem; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
        h1 { font-family: 'Outfit', sans-serif; margin-bottom: 1rem; }
        input { width: 100%; padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        .btn { background: #8b5cf6; color: white; padding: 0.75rem; width: 100%; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Reset Password</h1>
        <input type="password" placeholder="New Password" required>
        <input type="password" placeholder="Confirm Password" required>
        <button class="btn">Reset Password</button>
    </div>
</body>
</html>\\\`;
    }

    private getDashboardViewStub() {
        return \\\`<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ArikaJS</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #8b5cf6;
            --bg: #f8fafc;
            --card-bg: white;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: rgba(15, 23, 42, 0.08);
        }
        [data-theme="dark"] {
            --bg: #030712;
            --card-bg: #111827;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: var(--bg); color: var(--text-main); min-height: 100vh; }
        nav { background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 1rem 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); }
        .logo { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--primary); text-decoration: none; }
        .user-menu { display: flex; align-items: center; gap: 1rem; }
        .logout-btn { padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
        .logout-btn:hover { background: #ef4444; color: white; }
        main { padding: 4rem 5%; max-width: 1200px; margin: 0 auto; }
        .header { margin-bottom: 3rem; animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        h1 { font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border); padding: 2rem; border-radius: 24px; transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-label { color: var(--text-muted); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.5rem; font-weight: 800; }
        .loading { display: flex; align-items: center; justify-content: center; height: 80vh; font-weight: 600; color: var(--text-muted); }
    </style>
</head>
<body>
    <div id="app" class="loading">Loading your dashboard...</div>

    <script>
        async function init() {
            const token = localStorage.getItem('arika_token');
            const app = document.getElementById('app');

            if (!token) {
                window.location.href = '/auth/login';
                return;
            }

            try {
                const response = await fetch('/api/user', {
                    headers: { 'Authorization': \\\`Bearer \\\\\${token}\\\` }
                });

                if (response.ok) {
                    const data = await response.json();
                    renderDashboard(data.user);
                } else {
                    localStorage.removeItem('arika_token');
                    window.location.href = '/auth/login';
                }
            } catch (err) {
                app.textContent = 'Failed to connect to server';
            }
        }

        function renderDashboard(user) {
            document.getElementById('app').className = '';
            document.getElementById('app').innerHTML = \\\`
                <nav>
                    <a href="/" class="logo">ArikaJS</a>
                    <div class="user-menu">
                        <span style="font-weight: 600;">\\\\\${user.name}</span>
                        <button class="logout-btn" onclick="logout()">Logout</button>
                    </div>
                </nav>
                <main>
                    <div class="header">
                        <h1>Welcome back, \\\\\${user.name.split(' ')[0]}!</h1>
                        <p style="color: var(--text-muted)">Here's what's happening with your account today.</p>
                    </div>
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-label">Account Status</div>
                            <div class="stat-value" style="color: #10b981;">Verified</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Email Address</div>
                            <div class="stat-valueHeader">\\\\\${user.email}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Member Since</div>
                            <div class="stat-value">\\\\\${new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </main>
            \\\`;
        }

        function logout() {
            localStorage.removeItem('arika_token');
            localStorage.removeItem('arika_user');
            window.location.href = '/auth/login';
        }

        init();
    </script>
</body>
</html>\\\`;
    }

    private getEmailTemplateStub() {
        return \\\`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #8b5cf6; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>ArikaJS Authentication</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_link}}" class="btn">Reset Password</a>
            </div>
            <p>This password reset link will expire in 60 minutes.</p>
            <p>If you did not request a password reset, no further action is required.</p>
            <p>Regards,<br>ArikaJS Team</p>
        </div>
        <div class="footer">
            &copy; {{year}} ArikaJS. All rights reserved.
        </div>
    </div>
</body>
</html>\\\`;
    }
}
\`;

fs.writeFileSync('/Users/prakashtank/Documents/nodeServices/ArikaJs/cli/src/Commands/AuthInstallCommand.ts', content);
