import { ServiceProvider, Event } from 'arikajs';

export class EventServiceProvider extends ServiceProvider {
    /**
     * The event to listener mappings for the application.
     *
     * Add your event → listener mappings here.
     * The key is the Event class name, the value is an array of Listener classes.
     *
     * Example:
     *   import { UserRegisteredEvent } from '@Events/UserRegisteredEvent';
     *   import { SendWelcomeEmailListener } from '@Listeners/SendWelcomeEmailListener';
     *
     *   protected listen = {
     *       [UserRegisteredEvent.name]: [
     *           SendWelcomeEmailListener,
     *       ],
     *   };
     */
    protected listen: Record<string, any[]> = {
        // [YourEvent.name]: [YourListener],
    };

    /**
     * Register any application services.
     */
    public register(): void {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public boot(): void {
        // Automatically register all event → listener mappings defined above
        for (const [eventName, listeners] of Object.entries(this.listen)) {
            for (const listener of listeners) {
                Event.listen(eventName, listener);
            }
        }
    }
}
