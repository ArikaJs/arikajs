import { Request, Response, Log } from 'arikajs';
import http from 'node:http';
import https from 'node:https';

export class ApiCheckerController {
    /**
     * Check the status of a given URL.
     */
    public async check(req: Request, res: Response) {
        const url = req.input('url');

        if (!url) {
            return res.json({ error: 'URL is required' }, 400);
        }

        try {
            const result = await this.ping(url);
            return res.json(result);
        } catch (error: any) {
            return res.json({
                url,
                status: 'offline',
                error: error.message
            }, 500);
        }
    }

    private ping(url: string): Promise<any> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const client = url.startsWith('https') ? https : http;

            const request = client.get(url, (response) => {
                const latency = Date.now() - startTime;
                resolve({
                    url,
                    status: response.statusCode! < 400 ? 'online' : 'unhealthy',
                    statusCode: response.statusCode,
                    latency: `${latency}ms`,
                    timestamp: new Date().toISOString()
                });
                response.resume(); // Consume response data to free up memory
            });

            request.on('error', (error) => {
                resolve({
                    url,
                    status: 'offline',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            });

            request.setTimeout(5000, () => {
                request.destroy();
                resolve({
                    url,
                    status: 'timeout',
                    error: 'Request timed out after 5000ms',
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
}
