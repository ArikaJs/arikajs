import { Pipeline } from '../src/Pipeline';
import { Request, Response } from '@arikajs/http';

import assert from 'node:assert';
import { test } from 'node:test';
import { ServerResponse } from 'node:http';

const mockServerResponse = () => ({
    setHeader: () => { },
    end: () => { },
} as unknown as ServerResponse);

test('Pipeline executes middleware in order', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    pipeline.pipe(async (req: Request, next: (req: Request) => Promise<Response> | Response) => {
        calls.push('start 1');
        const res = await next(req);
        calls.push('end 1');
        return res;
    });

    pipeline.pipe(async (req: Request, next: (req: Request) => Promise<Response> | Response) => {
        calls.push('start 2');
        const res = await next(req);
        calls.push('end 2');
        return res;
    });

    const request = {} as Request;
    const destination = async (req: Request) => {
        calls.push('destination');
        return new Response(mockServerResponse()).send('OK');
    };

    const response = await pipeline.handle(request, destination);

    assert.strictEqual(response.getContent(), 'OK');
    assert.deepStrictEqual(calls, [
        'start 1',
        'start 2',
        'destination',
        'end 2',
        'end 1'
    ]);
});

test('Middleware can short-circuit', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    pipeline.pipe(async (req: Request, next: (req: Request) => Promise<Response> | Response) => {
        calls.push('m1');
        return new Response(mockServerResponse()).send('Short-circuit');
    });

    pipeline.pipe(async (req: Request, next: (req: Request) => Promise<Response> | Response) => {
        calls.push('m2');
        return next(req);
    });

    const request = {} as Request;
    const destination = async (req: Request) => {
        calls.push('destination');
        return new Response(mockServerResponse()).send('OK');
    };

    const response = await pipeline.handle(request, destination);

    assert.strictEqual(response.getContent(), 'Short-circuit');
    assert.deepStrictEqual(calls, ['m1']);
});

test('Middleware can be a class', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    class Logger {
        async handle(req: Request, next: (req: Request) => Promise<Response>) {
            calls.push('logger');
            return next(req);
        }
    }

    pipeline.pipe(new Logger());

    const request = {} as Request;
    const destination = async (req: Request) => {
        calls.push('destination');
        return new Response(mockServerResponse()).send('OK');
    };

    await pipeline.handle(request, destination);

    assert.deepStrictEqual(calls, ['logger', 'destination']);
});

test('Middleware can be resolved from container', async () => {
    const container = {
        has: (token: any) => token === 'auth',
        make: (token: any) => {
            if (token === 'auth') return new AuthMiddleware();
            return null;
        }
    } as any;
    const calls: string[] = [];

    class AuthMiddleware {
        async handle(req: Request, next: (req: Request) => Promise<Response>) {
            calls.push('auth');
            return next(req);
        }
    }



    const pipeline = new Pipeline(container);
    pipeline.pipe('auth');

    const request = {} as Request;
    const destination = async (req: Request) => {
        calls.push('destination');
        return new Response(mockServerResponse()).send('OK');
    };

    await pipeline.handle(request, destination);

    assert.deepStrictEqual(calls, ['auth', 'destination']);
});
