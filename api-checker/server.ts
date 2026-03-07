import app from './bootstrap/app';
import { Log, config } from 'arikajs';

const start = async () => {
    // Start the application
    console.log('🚀 Starting ArikaJS application...');

    const port = config('http.port', 3000);

    await app.listen(port);
};

start().catch((err) => {
    console.error('Failed to start application:', err);
});
