
import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Event, EventManager, Listener } from '../src';

class OrderPlaced {
    constructor(public id: number) { }
}

class LogOrder implements Listener {
    static logs: number[] = [];
    handle(event: OrderPlaced) {
        LogOrder.logs.push(event.id);
    }
}

class LowPriorityListener implements Listener {
    static called = false;
    handle() {
        LowPriorityListener.called = true;
    }
}

class HighPriorityListener implements Listener {
    static called = false;
    handle() {
        HighPriorityListener.called = true;
        // If high priority runs first, we can check it
    }
}

describe('Advanced Events', () => {
    beforeEach(() => {
        const manager = new EventManager();
        Event.setManager(manager);
        LogOrder.logs = [];
    });

    it('supports listener priorities', async () => {
        let order: string[] = [];

        Event.listen(OrderPlaced, { handle: () => order.push('low') }, 0);
        Event.listen(OrderPlaced, { handle: () => order.push('high') }, 100);
        Event.listen(OrderPlaced, { handle: () => order.push('medium') }, 50);

        await Event.dispatch(new OrderPlaced(1));

        assert.deepStrictEqual(order, ['high', 'medium', 'low']);
    });

    it('supports wildcard listeners', async () => {
        let called = false;
        Event.listen('user.*', {
            handle: (event: string) => {
                called = true;
            }
        });

        await Event.dispatch('user.registered');
        assert.ok(called, 'Wildcard listener should be called for user.registered');

        called = false;
        await Event.dispatch('user.login');
        assert.ok(called, 'Wildcard listener should be called for user.login');

        called = false;
        await Event.dispatch('order.placed');
        assert.strictEqual(called, false, 'Wildcard listener should NOT be called for order.placed');
    });

    it('supports event subscribers', async () => {
        let events: string[] = [];

        class UserSubscriber {
            subscribe(events: EventManager) {
                events.listen('user.login', this.handleLogin);
                events.listen('user.logout', this.handleLogout);
            }

            handleLogin() { events.push('login'); }
            handleLogout() { events.push('logout'); }
        }

        Event.subscribe(UserSubscriber);

        await Event.dispatch('user.login');
        await Event.dispatch('user.logout');

        assert.deepStrictEqual(events, ['login', 'logout']);
    });

    it('can fake events', async () => {
        Event.fake();

        await Event.dispatch(new OrderPlaced(123));

        Event.assertDispatched(OrderPlaced);
        Event.assertDispatched(OrderPlaced, (e) => e.id === 123);

        assert.throws(() => {
            Event.assertDispatched(class NotSent { });
        });
    });
});
