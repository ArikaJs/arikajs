
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { HttpKernel, Request, Response, Application } from '../src';
import { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';

class MockApplication implements Application {
    config() { return { get: (key: string, def: any) => def }; }
    isBooted() { return true; }
    async boot() { }
    make(token: any) { return new token(); }
    singleton() { }
    getContainer() { return this; }
}

class MockRequest extends EventEmitter {
    method = 'GET';
    url = '/';
    headers = { host: 'localhost' };
}

class MockResponse extends EventEmitter {
    statusCode = 200;
    headers = {};
    body = '';
    writableEnded = false;
    setHeader(name: string, value: any) { this.headers[name] = value; }
    end(content: any) {
        this.body = content;
        this.writableEnded = true;
        this.emit('finish');
    }
}

describe('HttpKernel', () => {
    it('handles basic request through router', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);

        kernel.getRouter().get('/hello', (req: Request) => {
            return { hello: 'world' };
        });

        const req = new MockRequest() as any;
        req.url = '/hello';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' });
    });

    it('handles route parameters', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);

        kernel.getRouter().get('/users/:id', (req: Request, id: string) => {
            return { id };
        });

        const req = new MockRequest() as any;
        req.url = '/users/42';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.deepStrictEqual(JSON.parse(res.body), { id: '42' });
    });

    it('executes global middleware', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);
        let middlewareCalled = false;

        kernel.use(async (req: Request, next: Function) => {
            middlewareCalled = true;
            return next(req);
        });

        kernel.getRouter().get('/', () => 'ok');

        const req = new MockRequest() as any;
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(middlewareCalled, true);
        assert.strictEqual(res.body, 'ok');
    });

    it('handles 404 for missing routes', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);

        const req = new MockRequest() as any;
        req.url = '/not-found';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(res.statusCode, 404);
        assert.deepStrictEqual(JSON.parse(res.body), { error: 'Route not found' });
    });

    it('handles route groups with prefixes', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);

        kernel.getRouter().group({ prefix: 'api' }, (router) => {
            router.get('/v1', () => 'api v1');
        });

        const req = new MockRequest() as any;
        req.url = '/api/v1';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(res.body, 'api v1');
    });

    it('handles nested route groups', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);

        kernel.getRouter().group({ prefix: 'api' }, (router) => {
            router.group({ prefix: 'v1' }, (router) => {
                router.get('/test', () => 'nested');
            });
        });

        const req = new MockRequest() as any;
        req.url = '/api/v1/test';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(res.body, 'nested');
    });

    it('executes route-specific middleware', async () => {
        const app = new MockApplication();
        const kernel = new HttpKernel(app as any);
        let middlewareCalled = false;

        kernel.getRouter().get('/secret', () => 'secret').middleware([
            async (req: Request, next: Function) => {
                middlewareCalled = true;
                return next(req);
            }
        ]);

        const req = new MockRequest() as any;
        req.url = '/secret';
        const res = new MockResponse() as any;

        await kernel.handle(req, res);

        assert.strictEqual(middlewareCalled, true);
        assert.strictEqual(res.body, 'secret');
    });
});
