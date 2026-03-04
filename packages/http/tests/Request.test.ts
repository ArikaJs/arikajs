
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Request } from '../src/Request';

const mockApp = {
    config: () => ({
        get: (key: string, defaultValue: any) => defaultValue
    })
} as any;

describe('Request', () => {
    it('can get the HTTP method', () => {
        const mockReq = { method: 'POST', url: '/', headers: { host: 'localhost' } } as any;
        const request = new Request(mockApp, mockReq);
        assert.strictEqual(request.method(), 'POST');
    });

    it('can get the request path', () => {
        const mockReq = { method: 'GET', url: '/users?id=1', headers: { host: 'localhost' } } as any;
        const request = new Request(mockApp, mockReq);
        assert.strictEqual(request.path(), '/users');
    });

    it('can get query parameters', () => {
        const mockReq = { method: 'GET', url: '/test?foo=bar', headers: { host: 'localhost' } } as any;
        const request = new Request(mockApp, mockReq);
        assert.strictEqual(request.query('foo'), 'bar');
    });

    it('can get headers', () => {
        const mockReq = { method: 'GET', url: '/', headers: { 'x-test': 'value', host: 'localhost' } } as any;
        const request = new Request(mockApp, mockReq);
        assert.strictEqual(request.header('X-Test'), 'value');
    });

    it('can get input from query and body', () => {
        const mockReq = { method: 'POST', url: '/?a=1', headers: { host: 'localhost' } } as any;
        const request = new Request(mockApp, mockReq);
        request.setBody({ b: 2 });

        assert.strictEqual(request.input('a'), '1');
        assert.strictEqual(request.input('b'), 2);
    });
});
