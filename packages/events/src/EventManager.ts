
import { Dispatcher } from './Dispatcher';
import { ListenerResolver } from './ListenerResolver';
import { EventException } from './Exceptions/EventException';

export class EventManager {
    private listeners: Map<any, { listener: any, priority: number }[]> = new Map();
    private wildcards: Map<string, { listener: any, priority: number }[]> = new Map();
    private dispatcher: Dispatcher;
    private resolver: ListenerResolver;
    private dispatched: any[] = [];
    private isFaking: boolean = false;

    constructor(resolver?: ListenerResolver) {
        this.resolver = resolver || new ListenerResolver();
        this.dispatcher = new Dispatcher((ln) => this.resolver.resolve(ln));
    }

    public listen(event: any, listener: any, priority: number = 0) {
        if (typeof event === 'string' && event.includes('*')) {
            this.setupWildcard(event, listener, priority);
        } else {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event)?.push({ listener, priority });
        }
        return this;
    }

    private setupWildcard(event: string, listener: any, priority: number) {
        if (!this.wildcards.has(event)) {
            this.wildcards.set(event, []);
        }
        this.wildcards.get(event)?.push({ listener, priority });
    }

    public subscribe(subscriber: any) {
        const subscriberInstance = typeof subscriber === 'function' ? new subscriber() : subscriber;
        if (typeof subscriberInstance.subscribe === 'function') {
            subscriberInstance.subscribe(this);
        }
    }

    public forget(event: any) {
        this.listeners.delete(event);
        this.wildcards.delete(event);
        return this;
    }

    public async dispatch(event: any): Promise<void> {
        if (this.isFaking) {
            this.dispatched.push(event);
            return;
        }

        const listeners = this.getSortedListeners(event);

        if (listeners.length > 0) {
            await this.dispatcher.dispatch(event, listeners);
        }
    }

    private getSortedListeners(event: any): any[] {
        let listeners: { listener: any, priority: number }[] = [];

        // 1. Get exact listeners
        const eventKey = typeof event === 'object' ? event.constructor : event;
        if (this.listeners.has(eventKey)) {
            listeners = [...this.listeners.get(eventKey)!];
        }

        // 2. Get wildcard listeners
        if (typeof event === 'string' || (typeof event === 'object' && event.constructor.name)) {
            const eventName = typeof event === 'string' ? event : event.constructor.name;
            for (const [pattern, wildcardListeners] of this.wildcards.entries()) {
                if (this.matchWildcard(pattern, eventName)) {
                    listeners = listeners.concat(wildcardListeners);
                }
            }
        }

        // 3. Sort by priority (descending)
        return listeners
            .sort((a, b) => b.priority - a.priority)
            .map(l => l.listener);
    }

    private matchWildcard(pattern: string, eventName: string): boolean {
        const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return regex.test(eventName);
    }

    // Testing helpers
    public fake() {
        this.isFaking = true;
    }

    public assertDispatched(event: any, callback?: (event: any) => boolean) {
        const found = this.dispatched.some(e => {
            const matches = e instanceof event || e.constructor === event || e === event;
            if (matches && callback) {
                return callback(e);
            }
            return matches;
        });

        if (!found) {
            throw new Error(`Event [${event.name || event}] was not dispatched.`);
        }
    }
}
