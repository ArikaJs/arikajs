
import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Event, EventManager, Listener } from '../src';

class UserRegistered {
    constructor(public user: { name: string }) { }
}

class SendWelcomeEmail implements Listener {
    static handled = false;
    static receivedEvent: any = null;

    handle(event: UserRegistered) {
        SendWelcomeEmail.handled = true;
        SendWelcomeEmail.receivedEvent = event;
    }
}

describe('Events', () => {
    before(() => {
        // Reset state
        SendWelcomeEmail.handled = false;
        SendWelcomeEmail.receivedEvent = null;

        // Setup manager
        const manager = new EventManager();
        Event.setManager(manager);
    });

    it('dispatches event to registered listener', async () => {
        // Listen
        Event.listen(UserRegistered, SendWelcomeEmail);

        // Dispatch
        const user = { name: 'Prakash' };
        await Event.dispatch(new UserRegistered(user));

        // Assert
        assert.ok(SendWelcomeEmail.handled, 'Listener should have been handled');
        assert.deepStrictEqual(SendWelcomeEmail.receivedEvent.user, user);
    });

    it('does not dispatch if listener is forgotten', async () => {
        // Reset
        SendWelcomeEmail.handled = false;

        // Forget
        Event.forget(UserRegistered);

        // Dispatch
        await Event.dispatch(new UserRegistered({ name: 'Test' }));

        // Assert
        assert.strictEqual(SendWelcomeEmail.handled, false, 'Listener should not have run');
    });

    it('handles class-based listeners resolution', async () => {
        // Re-listen
        Event.listen(UserRegistered, SendWelcomeEmail); // Class reference

        SendWelcomeEmail.handled = false;
        await Event.dispatch(new UserRegistered({ name: 'Resolution' }));

        assert.ok(SendWelcomeEmail.handled);
    });
});
