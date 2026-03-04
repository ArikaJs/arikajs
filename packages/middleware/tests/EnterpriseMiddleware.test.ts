import { Pipeline } from '../src/Pipeline';
import { Request, Response } from '@arikajs/http';
import assert from 'node:assert';
import { test } from 'node:test';
import { ServerResponse } from 'node:http';

const mockServerResponse = () => ({
    setHeader: () => { },
    end: () => { },
} as unknown as ServerResponse);

test('Enterprise Middleware with arguments', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    // Functional middleware with arguments
    // Signature is (req, next, ...args)
    pipeline.pipe(async (req: any, next: any, res: any, role: string) => {
        calls.push(`role:${role}`);
        return next(req);
    });

    const request = {} as Request;
    const destination = async (req: Request) => {
        calls.push('destination');
        return new Response(mockServerResponse()).send('OK');
    };

    // We need to pass the handler as a string to trigger parsing in this simple test,
    // but usually it's used with aliases. Let's register an alias.
    pipeline.setAliases({
        'checkRole': async (req: any, next: any, res: any, role: string) => {
            calls.push(`role:${role}`);
            return next(req);
        }
    });

    pipeline.pipe('checkRole:admin');

    await pipeline.handle(request, destination);

    // Note: Since we piped the anonymous function first (without args) 
    // and then the alias with 'admin', we expect 'role:undefined' then 'role:admin'
    assert.deepStrictEqual(calls, ['role:undefined', 'role:admin', 'destination']);
});

test('Middleware with multiple arguments', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    pipeline.setAliases({
        'gate': async (req: any, next: any, res: any, p1: string, p2: string) => {
            calls.push(`params:${p1},${p2}`);
            return next(req);
        }
    });

    pipeline.pipe('gate:foo,bar');

    const request = {} as Request;
    const destination = async (req: Request) => {
        return new Response(mockServerResponse()).send('OK');
    };

    await pipeline.handle(request, destination);

    assert.deepStrictEqual(calls, ['params:foo,bar']);
});

test('Middleware groups resolution', async () => {
    const pipeline = new Pipeline();
    const calls: string[] = [];

    pipeline.setAliases({
        'm1': async (req: any, next: any) => { calls.push('m1'); return next(req); },
        'm2': async (req: any, next: any) => { calls.push('m2'); return next(req); }
    });

    pipeline.setMiddlewareGroups({
        'web': ['m1', 'm2']
    });

    pipeline.pipe('web');

    const request = {} as Request;
    const destination = async (req: Request) => {
        return new Response(mockServerResponse()).send('OK');
    };

    await pipeline.handle(request, destination);

    assert.deepStrictEqual(calls, ['m1', 'm2']);
});
