
import { EventManager } from './EventManager';
import { Listener } from './Contracts/Listener';
import { EventException } from './Exceptions/EventException';

export class Event {
    private static instance: EventManager = new EventManager();

    public static dispatch(event: any): Promise<void> {
        return this.instance.dispatch(event);
    }

    public static listen(event: any, listener: any, priority: number = 0) {
        return this.instance.listen(event, listener, priority);
    }

    public static forget(event: any) {
        return this.instance.forget(event);
    }

    public static fake() {
        return this.instance.fake();
    }

    public static assertDispatched(event: any, callback?: (event: any) => boolean) {
        return (this.instance as any).assertDispatched(event, callback);
    }

    public static subscribe(subscriber: any) {
        return this.instance.subscribe(subscriber);
    }

    // Facade helper to set a custom manager
    public static setManager(manager: EventManager) {
        this.instance = manager;
    }

    public static getManager(): EventManager {
        return this.instance;
    }
}

export { EventManager, Listener, EventException };
