
import { ServiceProvider } from '@arikajs/foundation';
import { EventManager, Event } from '@arikajs/events';

export class EventsServiceProvider extends ServiceProvider {
    public async register() {
        this.app.singleton('events', () => {
            return new EventManager();
        });

        this.app.singleton(EventManager, () => this.app.resolve('events'));
    }

    public async boot() {
        // Initialize the Event facade
        const manager = this.app.resolve(EventManager);
        Event.setManager(manager);
    }
}
