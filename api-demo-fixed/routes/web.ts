import { Route, Request, Response, view } from 'arikajs';

Route.get('/', (req: Request, res: Response) => {
    return view('welcome', { name: 'ArikaApp' });
});

// Example of a protected route
// Route.get('/dashboard', (req: Request, res: Response) => {
//     return view('dashboard');
// }).withMiddleware('auth');
