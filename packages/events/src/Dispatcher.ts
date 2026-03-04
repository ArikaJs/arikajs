
import { Listener } from './Contracts/Listener';
import { EventException } from './Exceptions/EventException';

export class Dispatcher {
    constructor(private resolver: (listener: any) => Promise<Listener>) { }

    async dispatch(event: any, listeners: any[]): Promise<void> {
        for (const listenerClass of listeners) {
            let listener: Listener;

            try {
                // If it's already an instance
                if (typeof listenerClass !== 'function') {
                    listener = listenerClass;
                } else {
                    // Resolve via the resolver (DI container usually)
                    listener = await this.resolver(listenerClass);
                }
            } catch (error: any) {
                throw new EventException(`Failed to resolve listener: ${error.message}`);
            }

            if (!listener || typeof listener.handle !== 'function') {
                throw new EventException(`Listener [${listenerClass.name || listenerClass}] must implement handle() method.`);
            }

            // Check if queue implementation is needed later
            if (listener.shouldQueue) {
                // In a real app, this would push to queue
                // For now we await it just like sync, or we could fire & forget
                // await this.queue.push(listener, event);
                // mocking queue behavior by running async without blocking if we wanted
                await listener.handle(event);
            } else {
                await listener.handle(event);
            }
        }
    }
}
