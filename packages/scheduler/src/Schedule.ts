
import { Event } from './Event';

export class Schedule {
    protected events: Event[] = [];

    /**
     * Add a new callback event to the schedule.
     */
    public call(callback: Function): Event {
        const event = new Event(callback);
        this.events.push(event);
        return event;
    }

    /**
     * Add a new command event to the schedule.
     */
    public command(command: string): Event {
        const event = new Event(command);
        this.events.push(event);
        return event;
    }

    /**
     * Add a new job event to the schedule.
     */
    public job(job: any): Event {
        const event = new Event(async () => {
            const { Queue } = await import('@arikajs/queue');
            await Queue.dispatch(job);
        });
        this.events.push(event);
        return event;
    }

    /**
     * Get all events.
     */
    public allEvents(): Event[] {
        return this.events;
    }

    /**
     * Get due events.
     */
    public dueEvents(date: Date, timezone?: string): Event[] {
        return this.events.filter(event => event.isDue(date, timezone));
    }
}
