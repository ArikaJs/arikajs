import { VerifyEmailController } from '@Controllers/Auth/VerifyEmailController';
import { ResetPasswordController } from '@Controllers/Auth/ResetPasswordController';
import { ForgotPasswordController } from '@Controllers/Auth/ForgotPasswordController';
import { RegisterController } from '@Controllers/Auth/RegisterController';
import { LoginController } from '@Controllers/Auth/LoginController';
import { Route, Request, Response, app } from 'arikajs';
import { UserController } from '@Controllers/UserController';

Route.get('/', () => {
    return {
        framework: 'ArikaJS',
        version: app().version(),
        type: 'Fullstack',
        language: 'TypeScript',
        status: 'Online',
        message: 'Welcome to your premium ArikaJS Fullstack Application',
        links: {
            docs: 'https://github.com/arikajs/arikajs#readme',
            github: 'https://github.com/arikajs/arikajs'
        }
    };
});

Route.get('/status', () => {
    return {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };
});

// Users CRUD Routes
const userController = new UserController();

Route.get('/users', userController.index);
Route.get('/users/:id', userController.show);
Route.post('/users', userController.store);
Route.put('/users/:id', userController.update);
Route.delete('/users/:id', userController.destroy);

// Example of a protected API route
// Route.get('/me', (req: Request, res: Response) => {
//     return req.auth.user();
// }).withMiddleware('auth:api');

// Authentication Routes (API)
Route.group({ prefix: 'auth' }, () => {
    Route.post('/register', [RegisterController, 'register']);
    Route.post('/login', [LoginController, 'login']);
    Route.post('/logout', [LoginController, 'logout']).withMiddleware('auth:api');

    // Email Verification
    Route.get('/verify', [VerifyEmailController, 'verify']);
    Route.post('/verification-notification', [VerifyEmailController, 'resend']).withMiddleware('auth:api');

    // Password Reset
    Route.post('/password/email', [ForgotPasswordController, 'sendResetLinkEmail']);
    Route.post('/password/reset', [ResetPasswordController, 'reset']);
});

Route.get('/user', [LoginController, 'me']).withMiddleware('auth:api');
