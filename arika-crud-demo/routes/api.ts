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
            docs: 'https://arikajs.github.io/',
            github: 'https://github.com/arikajs/arikajs'
        }
    };
});

Route.get('/status', () => {
    return {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toLocaleString('sv-SE', { timeZone: process.env.APP_TIMEZONE })
    };
});

// Users CRUD Routes
Route.get('/users', [UserController, 'index']);
Route.get('/users/:id', [UserController, 'show']);
Route.post('/users', [UserController, 'store']);
Route.put('/users/:id', [UserController, 'update']);
Route.delete('/users/:id', [UserController, 'destroy']);

// Example of a protected API route
// Route.get('/me', (req: Request, res: Response) => {
//     return req.auth.user();
// }).withMiddleware('auth:api');
