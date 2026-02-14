
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src';
import { Router } from '@arikajs/router';

describe('ArikaJS Framework', () => {
    it('can create an application instance', () => {
        const app = createApp();
        assert.ok(app instanceof Object);
        assert.ok(app.getRouter() instanceof Router);
    });

    it('can register routes through the app', () => {
        const app = createApp();
        app.get('/test', () => 'hello');

        const matched = app.getRouter().match('GET', '/test');
        assert.ok(matched !== null);
        assert.strictEqual(matched.route.path, '/test');
    });

    it('boots correctly', async () => {
        const app = createApp();
        app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
        await app.boot();
        assert.ok(app.isBooted());
    });

    it('can handle requests through the kernel', async () => {
        const app = createApp();
        app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
        app.config().set('logging', {
            default: 'console',
            channels: {
                console: {
                    driver: 'console'
                }
            }
        });

        app.get('/hello', () => ({ message: 'world' }));

        await app.boot();

        const { Kernel } = await import('../src/http/Kernel');
        const { Request, Response } = await import('@arikajs/http');
        const { ServerResponse } = await import('node:http');

        const kernel = new Kernel(app);

        // Mock Node.js response
        const mockRes = {
            setHeader: () => { },
            writeHead: () => { },
            end: () => { },
            statusCode: 200
        } as unknown as ServerResponse;

        const request = new Request(app, { method: 'GET', url: '/hello', headers: {} } as any);
        const response = new Response(mockRes);

        const result = await kernel.handle(request, response);

        assert.strictEqual(result.getContent(), JSON.stringify({ message: 'world' }));
    });
});
