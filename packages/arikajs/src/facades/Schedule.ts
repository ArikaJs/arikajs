import { app } from '../helpers.js';
import { Scheduler, Schedule as BaseSchedule } from '@arikajs/scheduler';

/**
 * The amazing Laravel-like static Schedule Facade.
 * This completely eliminates the need for developers to manually resolve
 * the Scheduler from the container or wrap their events in `.define()`!
 */
export const Schedule = new Proxy({} as BaseSchedule, {
    get(target, prop) {
        // Automatically inject and resolve the underlying Scheduler singleton on demand
        const scheduler = app().make(Scheduler) as Scheduler;
        
        // Expose the raw schedule builder instance
        const underlyingSchedule = (scheduler as any).schedule as BaseSchedule;
        
        const value = (underlyingSchedule as any)[prop];
        
        // If it's a builder method (like .call() or .command()), bind it perfectly
        if (typeof value === 'function') {
            return value.bind(underlyingSchedule);
        }
        
        return value;
    }
});
