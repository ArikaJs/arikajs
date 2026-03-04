import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Route } from '../src/Route';
import { RouteRegistry } from '../src/RouteRegistry';
import { Router } from '../src/Router';

describe('Advanced Routing Features', () => {
    let router: Router;

    beforeEach(() => {
        RouteRegistry.getInstance().clear();
        router = new Router();
    });

    it('can apply regex constraints to parameters using where()', () => {
        Route.get('/user/:id', () => 'user').where('id', '[0-9]+');

        const validMatch = router.match('GET', '/user/123');
        assert.ok(validMatch !== null);
        assert.strictEqual(validMatch.params.id, '123');

        const invalidMatch = router.match('GET', '/user/abc');
        assert.strictEqual(invalidMatch, null);
    });

    it('can register routes matching ANY method', () => {
        Route.any('/all', () => 'all');

        assert.ok(router.match('GET', '/all') !== null);
        assert.ok(router.match('POST', '/all') !== null);
        assert.ok(router.match('PUT', '/all') !== null);
        assert.ok(router.match('DELETE', '/all') !== null);
    });

    it('can register redirect routes', async () => {
        Route.redirect('/old', '/new', 301);

        const matched = router.match('ANY', '/old');
        assert.ok(matched !== null);

        // Emulate dispatcher executing the block
        const responseData = await matched.route.handler({}, {});
        assert.deepStrictEqual(responseData, { $status: 301, $redirect: '/new' });
    });

    it('can register resource routes', () => {
        Route.resource('posts', class MockController { });

        assert.ok(router.match('GET', '/posts') !== null);
        assert.ok(router.match('GET', '/posts/create') !== null);
        assert.ok(router.match('POST', '/posts') !== null);
        assert.ok(router.match('GET', '/posts/1') !== null);
        assert.ok(router.match('GET', '/posts/1/edit') !== null);
        assert.ok(router.match('PUT', '/posts/1') !== null);
        assert.ok(router.match('PATCH', '/posts/1') !== null);
        assert.ok(router.match('DELETE', '/posts/1') !== null);
    });

    it('can generate URL from named routes (Reverse Routing)', () => {
        Route.get('/posts/:id/comments/:commentId', () => 'show').as('post.comment');

        const url = router.route('post.comment', { id: 5, commentId: 10 });
        assert.strictEqual(url, '/posts/5/comments/10');
    });

    it('throws error when generating URL for unknown name', () => {
        assert.throws(() => {
            router.route('unknown.route', { id: 5 });
        }, /Route \[unknown.route\] not found/);
    });

    it('can chain prefix and middleware fluently', () => {
        Route.prefix('api').middleware('auth').group(() => {
            Route.get('/users', () => 'users');
        });

        const matched = router.match('GET', '/api/users');
        assert.ok(matched !== null);
        assert.strictEqual(matched.route.path, '/api/users');
        assert.deepStrictEqual(matched.route.middleware, ['auth']);
    });
});
