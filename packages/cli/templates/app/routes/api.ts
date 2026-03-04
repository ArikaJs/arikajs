import { Route, app } from 'arikajs';
import { UserController } from '../app/Http/Controllers/UserController';

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
