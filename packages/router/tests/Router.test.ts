import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Route } from '../src/Route';
import { RouteRegistry } from '../src/RouteRegistry';
import { Router } from '../src/Router';

describe('Router', () => {
    let router: Router;

    beforeEach(() => {
        RouteRegistry.getInstance().clear();
        router = new Router();
    });

    it('can register a basic GET route', () => {
        Route.get('/hello', () => 'world');
        const matched = router.match('GET', '/hello');

        assert.ok(matched !== null);
        assert.strictEqual(matched.route.path, '/hello');
    });

    it('can register a route with parameters', () => {
        Route.get('/users/:id', () => 'user');
        const matched = router.match('GET', '/users/123');

        assert.ok(matched !== null);
        assert.strictEqual(matched.params.id, '123');
    });

    it('can group routes with middleware', () => {
        const middleware = ['auth'];
        Route.group({ middleware }, () => {
            Route.get('/profile', () => 'profile');
        });

        const matched = router.match('GET', '/profile');
        assert.ok(matched !== null);
        assert.deepStrictEqual(matched.route.middleware, ['auth']);
    });

    it('can group routes with prefix', () => {
        Route.group({ prefix: 'api' }, () => {
            Route.get('/v1', () => 'v1');
        });

        const matched = router.match('GET', '/api/v1');
        assert.ok(matched !== null);
        assert.strictEqual(matched.route.path, '/api/v1');
    });
});
