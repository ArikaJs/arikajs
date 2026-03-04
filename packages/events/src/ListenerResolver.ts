
import { Dispatcher } from './Dispatcher';
import { Listener } from './Contracts/Listener';
import { EventException } from './Exceptions/EventException';

export class ListenerResolver {
    // This would typically interface with the service container
    // For now we do a simple instantiation
    async resolve(listener: any): Promise<Listener> {
        if (typeof listener === 'function') {
            const isClass = /^\s*class\s+/.test(listener.toString()) ||
                (listener.prototype && typeof listener.prototype.handle === 'function');

            if (isClass) {
                try {
                    return new listener();
                } catch (e: any) {
                    throw new EventException(`Resolver failed to instantiate listener: ${e.message}`);
                }
            }

            // It's a closure/function, wrap it in a listener object
            return { handle: listener };
        }
        return listener;
    }
}
