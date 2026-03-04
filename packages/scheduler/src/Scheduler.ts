
import { Container } from '@arikajs/foundation';
import { Log } from '@arikajs/logging';
import { Schedule } from './Schedule';
import { Event } from './Event';

export class Scheduler {
    protected schedule: Schedule;

    constructor(protected container: Container) {
        this.schedule = new Schedule();
    }

    /**
     * Define the schedule.
     */
    public define(callback: (schedule: Schedule) => void): this {
        callback(this.schedule);
        return this;
    }

    /**
     * Run the scheduled tasks.
     */
    public async run(date: Date = new Date()): Promise<void> {
        const config = this.container.make('config') as any;
        const timezone = config.get('app.timezone', 'UTC');
        const dueEvents = this.schedule.dueEvents(date, timezone);

        if (dueEvents.length === 0) {
            return;
        }

        // Leader Election (Prevent multiple instances from running the same schedule)
        if (await this.shouldSkipBecauseAnotherInstanceIsRunning()) {
            return;
        }

        Log.info(`Running ${dueEvents.length} scheduled tasks in parallel...`);

        // Run events in parallel
        await Promise.allSettled(dueEvents.map(event => this.runEvent(event)));
    }

    protected async shouldSkipBecauseAnotherInstanceIsRunning(): Promise<boolean> {
        if (!this.container.has('cache')) return false;
        const cache = this.container.make('cache') as any;

        const lockKey = 'framework/scheduler-leader-lock';
        const isLeader = await cache.add(lockKey, true, 55); // Lock for 55 seconds

        if (!isLeader) {
            Log.debug('Another instance is already running the scheduler. Skipping...');
            return true;
        }

        return false;
    }

    protected async runEvent(event: Event): Promise<void> {
        const name = this.getEventName(event);

        try {
            await this.dispatchLifecycleEvent('TaskStarting', event);

            // Check for overlapping
            if (event.shouldSkipOverlapping()) {
                const locked = await this.isLocked(event);
                if (locked) {
                    Log.debug(`Skipping task [${name}] as it is still running.`);
                    return;
                }
                await this.lock(event);
            }

            Log.info(`Running scheduled task: [${name}]`);

            // Handle execution with Retries and Timeout
            await this.executeWithRetries(event);

            Log.info(`Task [${name}] completed successfully.`);
            await this.dispatchLifecycleEvent('TaskFinished', event);

        } catch (e: any) {
            Log.error(`Task [${name}] failed: ${e.message}`);
            await this.dispatchLifecycleEvent('TaskFailed', event, { error: e });
        } finally {
            if (event.shouldSkipOverlapping()) {
                await this.unlock(event);
            }
        }
    }

    protected async executeWithRetries(event: Event): Promise<void> {
        const maxRetries = event.getRetries();
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                await this.executeWithTimeout(event);
                return;
            } catch (e) {
                attempt++;
                if (attempt > maxRetries) throw e;

                const delay = event.getRetryDelay();
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));
                }

                Log.warning(`Retrying task [${this.getEventName(event)}] (Attempt ${attempt}/${maxRetries})...`);
            }
        }
    }

    protected async executeWithTimeout(event: Event): Promise<void> {
        const timeoutSeconds = event.getTimeout();

        if (timeoutSeconds <= 0) {
            return this.actuallyRun(event);
        }

        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Task timed out after ${timeoutSeconds} seconds.`));
            }, timeoutSeconds * 1000);

            try {
                await this.actuallyRun(event);
                clearTimeout(timer);
                resolve();
            } catch (e) {
                clearTimeout(timer);
                reject(e);
            }
        });
    }

    protected async actuallyRun(event: Event): Promise<void> {
        if (typeof event.command === 'string') {
            const { CommandRegistry } = await import('@arikajs/console');
            const registry = this.container.make(CommandRegistry) as any;
            await registry.run([event.command]);
        } else {
            await event.run();
        }
    }

    protected async dispatchLifecycleEvent(type: string, event: Event, extra: any = {}): Promise<void> {
        // Only if @arikajs/events is available
        try {
            const { Event: Emitter } = await import('@arikajs/events');
            await Emitter.dispatch({
                type: `scheduler.${type}`,
                task: this.getEventName(event),
                expression: event.expression(),
                ...extra
            });
        } catch (e) {
            // Events package might not be installed, ignore silently
        }
    }

    protected getEventName(event: Event): string {
        return event.getDescription() || (typeof event.command === 'string' ? event.command : 'closure');
    }

    protected async isLocked(event: Event): Promise<boolean> {
        if (!this.container.has('cache')) return false;
        const cache = this.container.make('cache') as any;
        return await cache.has(this.getMutexName(event));
    }

    protected async lock(event: Event): Promise<void> {
        if (!this.container.has('cache')) return;
        const cache = this.container.make('cache') as any;
        await cache.put(this.getMutexName(event), true, event.mutexExpiration());
    }

    protected async unlock(event: Event): Promise<void> {
        if (!this.container.has('cache')) return;
        const cache = this.container.make('cache') as any;
        await cache.forget(this.getMutexName(event));
    }

    protected getMutexName(event: Event): string {
        return `framework/schedule-${Buffer.from(this.getEventName(event) + event.expression()).toString('base64')}`;
    }
}
