import { test } from 'node:test';
import assert from 'node:assert';
import { Route, Router, RouteRegistry } from '../index';
import { Request, Response } from '@arikajs/http';

test('Router can register and match routes', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.get('/hello', () => 'world');

    const router = new Router();
    const matched = router.match('GET', '/hello');

    assert.ok(matched);
    assert.strictEqual(matched.route.path, '/hello');
    assert.strictEqual(matched.route.method, 'GET');
});

test('Router can handle groups with prefixes', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.group('/api', () => {
        Route.get('/users', () => 'users');
    });

    const router = new Router();
    const matched = router.match('GET', '/api/users');

    assert.ok(matched);
    assert.strictEqual(matched.route.path, '/api/users');
});

test('Router supports nested groups', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.group('/admin', () => {
        Route.group('/users', () => {
            Route.get('/list', () => 'admin-users-list');
        });
    });

    const router = new Router();
    const matched = router.match('GET', '/admin/users/list');

    assert.ok(matched);
    assert.strictEqual(matched.route.path, '/admin/users/list');
});

test('Router can extract route parameters', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.get('/users/:id', (request: Request, id: string) => id);

    const router = new Router();
    const matched = router.match('GET', '/users/123');

    assert.ok(matched);
    assert.strictEqual(matched.params.id, '123');

    // Mock request
    const mockRequest = {
        method: () => 'GET',
        path: () => '/users/123'
    } as unknown as Request;

    const mockResponse = {} as unknown as Response;

    const result = await router.dispatch(mockRequest, mockResponse);
    assert.strictEqual(result, '123');
});

test('Router supports group middleware', async (t) => {
    RouteRegistry.getInstance().clear();

    const middleware1 = () => { };
    const middleware2 = () => { };

    Route.group({ prefix: '/api', middleware: [middleware1] }, () => {
        Route.get('/users', () => 'users').withMiddleware(middleware2);
    });

    const router = new Router();
    const matched = router.match('GET', '/api/users');

    assert.ok(matched);
    assert.strictEqual(matched.route.middleware.length, 2);
    assert.strictEqual(matched.route.middleware[0], middleware1);
    assert.strictEqual(matched.route.middleware[1], middleware2);
});

test('Router supports fluent chaining', async (t) => {
    RouteRegistry.getInstance().clear();

    const route = Route.get('/fluent', () => 'ok')
        .as('fluent.route')
        .withMiddleware('some-middleware');

    assert.strictEqual(route.name, 'fluent.route');
    assert.strictEqual(route.middleware[0], 'some-middleware');
});

test('Router can dispatch routes', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.get('/hello', () => 'world');

    const router = new Router();
    // Mock request
    const mockRequest = {
        method: () => 'GET',
        path: () => '/hello'
    } as unknown as Request;

    const mockResponse = {} as unknown as Response;

    const result = await router.dispatch(mockRequest, mockResponse);
    assert.strictEqual(result, 'world');
});

test('Router returns null if no match', async (t) => {
    RouteRegistry.getInstance().clear();

    Route.get('/hello', () => 'world');

    const router = new Router();
    const mockRequest = {
        method: () => 'GET',
        path: () => '/not-found'
    } as unknown as Request;

    const mockResponse = {} as unknown as Response;

    const result = await router.dispatch(mockRequest, mockResponse);
    assert.strictEqual(result, null);
});

test('Router caches match results', async (t) => {
    RouteRegistry.getInstance().clear();
    Route.get('/cache-test', () => 'ok');

    let matchCount = 0;
    const router = new Router();

    // Patch the matcher to track calls
    const matcher = (router as any).matcher;
    const originalMatch = matcher.match;
    matcher.match = (...args: any[]) => {
        matchCount++;
        return originalMatch.apply(matcher, args);
    };

    router.match('GET', '/cache-test');
    router.match('GET', '/cache-test');
    const result = router.match('GET', '/cache-test');

    assert.ok(result);
    assert.strictEqual(matchCount, 1, 'Matcher should only be called once due to caching');
});

test('Router can clear cache', async (t) => {
    RouteRegistry.getInstance().clear();
    Route.get('/cache-test', () => 'ok');

    let matchCount = 0;
    const router = new Router();

    const matcher = (router as any).matcher;
    const originalMatch = matcher.match;
    matcher.match = (...args: any[]) => {
        matchCount++;
        return originalMatch.apply(matcher, args);
    };

    router.match('GET', '/cache-test');
    router.clearCache();
    router.match('GET', '/cache-test');

    assert.strictEqual(matchCount, 2, 'Matcher should be called twice because cache was cleared');
});
