
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Dispatcher } from '../src/Dispatcher';

describe('Dispatcher', () => {
    it('can dispatch to a closure handler', async () => {
        const dispatcher = new Dispatcher();
        const request = {};
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: {
                handler: (req: any) => ({ hello: 'world' })
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.deepStrictEqual(result.data, { hello: 'world' });
    });

    it('can execute route-level middleware', async () => {
        const dispatcher = new Dispatcher();
        const request = { count: 0 } as any;
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const middleware = async (req: any, next: any) => {
            req.count++;
            return next(req);
        };

        const matchedRoute = {
            route: {
                handler: (req: any) => ({ count: req.count }),
                middleware: [middleware]
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.strictEqual(result.data.count, 1);
    });

    it('can resolve and dispatch to a class controller', async () => {
        class TestController {
            index(req: any) {
                return { controller: 'works' };
            }
        }

        const container = {
            make: (key: any) => {
                if (key === TestController) return new TestController();
                return null;
            }
        };

        const dispatcher = new Dispatcher(container);
        const request = {};
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: {
                handler: [TestController, 'index']
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.deepStrictEqual(result.data, { controller: 'works' });
    });

    it('supports static controller middleware', async () => {
        class MiddlewareController {
            static middleware = [
                async (req: any, next: any) => {
                    req.controllerMiddlewareRan = true;
                    return next(req);
                }
            ];
            index(req: any) {
                return { fromController: req.controllerMiddlewareRan };
            }
        }

        const container = {
            make: () => new MiddlewareController()
        };

        const dispatcher = new Dispatcher(container);
        const request = { controllerMiddlewareRan: false } as any;
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: { handler: [MiddlewareController, 'index'] },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.strictEqual(result.data.fromController, true);
    });

    it('can set and use global exception handler', async () => {
        const dispatcher = new Dispatcher();

        dispatcher.setExceptionHandler((err, req, res) => {
            return { errorHandled: err.message };
        });

        const request = {};
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: {
                handler: () => { throw new Error('Crash!'); }
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.deepStrictEqual(result.data, { errorHandled: 'Crash!' });
    });

    it('supports rendering views with the response resolver', async () => {
        const dispatcher = new Dispatcher();
        const request = {};
        const response = {
            send: function (data: any) { this.data = data; return this; }
        } as any;

        class MyView {
            async render() {
                return '<html>rendered</html>';
            }
        }

        const matchedRoute = {
            route: {
                handler: () => new MyView()
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.strictEqual(result.data, '<html>rendered</html>');
    });
});
