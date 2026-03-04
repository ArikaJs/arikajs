import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src';
import { Router } from '@arikajs/router';
import { ServerResponse } from 'node:http';

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

    it('handles CORS preflight requests', async () => {
        const app = createApp();
        app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
        await app.boot();

        const { Kernel } = await import('../src/http/Kernel');
        const { Request, Response } = await import('@arikajs/http');
        const { ServerResponse } = await import('node:http');

        const kernel = new Kernel(app);

        const mockRes = {
            setHeader: (name: string, value: string) => {
                mockRes.headers[name] = value;
            },
            writeHead: () => { },
            end: () => { },
            statusCode: 200,
            headers: {} as Record<string, string>
        } as unknown as ServerResponse & { headers: Record<string, string> };

        const request = new Request(app, { method: 'OPTIONS', url: '/any', headers: {} } as any);
        const response = new Response(mockRes);

        const result = await kernel.handle(request, response);
        kernel.terminate(request, result);

        assert.strictEqual(mockRes.statusCode, 204);
        assert.strictEqual(mockRes.headers['Access-Control-Allow-Origin'], '*');
        assert.strictEqual(mockRes.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    });

    it('initializes the database manager and facade', async () => {
        const app = createApp();
        app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
        app.config().set('database', {
            default: 'sqlite',
            connections: {
                sqlite: {
                    driver: 'sqlite',
                    database: ':memory:'
                }
            }
        });

        await app.boot();

        const { DatabaseManager, Database } = await import('@arikajs/database');

        const manager = app.make(DatabaseManager);
        assert.ok(manager instanceof DatabaseManager);
        assert.strictEqual(manager, Database.getManager());
    });

    it('provides global helpers', async () => {
        const appInstance = createApp();
        appInstance.config().set('app.name', 'ArikaTest');

        const { app: appHelper, config: configHelper } = await import('../src');

        assert.strictEqual(appHelper(), appInstance);
        assert.strictEqual(configHelper('app.name'), 'ArikaTest');
    });

    it('initializes the event facade', async () => {
        const appInstance = createApp();
        appInstance.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');

        await appInstance.boot();

        const { Event } = await import('@arikajs/events');
        assert.ok(Event.getManager() !== null);
    });
});
