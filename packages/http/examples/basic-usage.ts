import { Application } from '@arikajs/foundation';
import { HttpKernel, HttpServiceProvider, Request } from '../src';
import http from 'node:http';

/**
 * 1. Initialize the ArikaJS Application
 */
const app = new Application(process.cwd());

async function bootstrap() {
    // 2. Register the HTTP Service Provider
    app.register(HttpServiceProvider);

    // 3. Boot the Application
    await app.boot();

    // 4. Resolve the Kernel
    const kernel = app.make(HttpKernel);

    // 5. Define some routes
    const router = kernel.getRouter();

    // Basic GET route
    router.get('/', () => {
        return {
            message: 'Welcome to ArikaJS HTTP!',
            version: '1.0.0'
        };
    });

    // Dynamic parameter route
    router.get('/users/:id', (request: Request) => {
        const userId = request.param('id');
        return {
            user_id: userId,
            status: 'active'
        };
    });

    // POST route with Body Parsing
    router.post('/login', (request: Request) => {
        const email = request.input('email');
        return {
            success: true,
            message: `Logged in as ${email}`
        };
    });

    // 6. Create the Node.js Server
    const server = http.createServer((req, res) => {
        kernel.handle(req, res);
    });

    // 7. Start listening
    const port = 3000;
    server.listen(port, () => {
        console.log(`🚀 ArikaJS HTTP Server running at http://localhost:${port}`);
    });
}

bootstrap().catch(console.error);
