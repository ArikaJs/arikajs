
import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { VerifyCsrfToken } from '../src/Middleware/VerifyCsrfToken';

describe('VerifyCsrfTokenMiddleware', () => {
    it('passes for safe methods (GET, HEAD, OPTIONS)', async () => {
        const middleware = new VerifyCsrfToken();
        const request = {
            method: () => 'GET',
            path: () => '/test'
        } as any;
        const next = async () => 'success';
        
        const result = await middleware.handle(request, next);
        assert.strictEqual(result, 'success');
    });

    it('denies POST request without token', async () => {
        const middleware = new VerifyCsrfToken();
        const request = {
            method: () => 'POST',
            path: () => '/test',
            session: { token: () => 'valid-token' },
            input: () => ({}),
            header: () => null
        } as any;
        const next = async () => 'success';
        
        try {
            await middleware.handle(request, next);
            assert.fail('Should have thrown 419 error');
        } catch (e: any) {
            assert.strictEqual(e.statusCode, 419);
        }
    });

    it('allows POST request with valid token from input', async () => {
        const middleware = new VerifyCsrfToken();
        const request = {
            method: () => 'POST',
            path: () => '/test',
            session: { token: () => 'secret-123' },
            input: (key: string) => key === '_token' ? 'secret-123' : null,
            header: () => null
        } as any;
        const next = async () => 'success';
        
        const result = await middleware.handle(request, next);
        assert.strictEqual(result, 'success');
    });

    it('allows POST request with valid token from header', async () => {
        const middleware = new VerifyCsrfToken();
        const request = {
            method: () => 'POST',
            path: () => '/test',
            session: { token: () => 'secret-header' },
            input: () => null,
            header: (key: string) => key.toLowerCase() === 'x-csrf-token' ? 'secret-header' : null
        } as any;
        const next = async () => 'success';
        
        const result = await middleware.handle(request, next);
        assert.strictEqual(result, 'success');
    });

    it('allows excluded paths', async () => {
        class ExcludedMiddleware extends VerifyCsrfToken {
            protected except = ['/api/*'];
        }
        const middleware = new ExcludedMiddleware();
        const request = {
            method: () => 'POST',
            path: () => '/api/tasks',
            session: { token: () => 'token' },
            input: () => ({}),
            header: () => null
        } as any;
        const next = async () => 'success';
        
        const result = await middleware.handle(request, next);
        assert.strictEqual(result, 'success');
    });
});
