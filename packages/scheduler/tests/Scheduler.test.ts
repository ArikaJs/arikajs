
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Schedule } from '../src/Schedule';
import { Scheduler } from '../src/Scheduler';
import { Container } from '@arikajs/foundation';
import { Log, LogManager } from '@arikajs/logging';

// Setup basic logging for tests
Log.setManager(new LogManager({
    default: 'console',
    channels: {
        console: { driver: 'console' }
    }
} as any));

describe('Scheduler', () => {
    it('can schedule a closure', () => {
        const schedule = new Schedule();
        let executed = false;

        schedule.call(() => {
            executed = true;
        }).everyMinute();

        const events = schedule.allEvents();
        assert.strictEqual(events.length, 1);
        assert.strictEqual(events[0].expression(), '* * * * *');
    });

    it('identifies due events correctly', () => {
        const schedule = new Schedule();
        schedule.call(() => { }).cron('0 0 * * *'); // Daily at midnight

        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);

        const noon = new Date();
        noon.setHours(12, 0, 0, 0);

        assert.strictEqual(schedule.dueEvents(midnight).length, 1);
        assert.strictEqual(schedule.dueEvents(noon).length, 0);
    });

    it('can run due events', async () => {
        const container = new Container();
        container.instance('config', { get: () => 'UTC' });

        const scheduler = new Scheduler(container);
        let count = 0;

        scheduler.define((schedule) => {
            schedule.call(() => {
                count++;
            }).everyMinute();
        });

        const now = new Date();
        now.setSeconds(0, 0);

        await scheduler.run(now);
        assert.strictEqual(count, 1);
    });

    it('can retry failed tasks', async () => {
        const container = new Container();
        container.instance('config', { get: () => 'UTC' });

        const scheduler = new Scheduler(container);
        let attempts = 0;

        scheduler.define((schedule) => {
            schedule.call(() => {
                attempts++;
                throw new Error('Fail');
            }).everyMinute().retry(2);
        });

        const now = new Date();
        now.setSeconds(0, 0);

        await scheduler.run(now);
        // Initial run + 2 retries = 3 attempts
        assert.strictEqual(attempts, 3);
    });

    it('handles task timeouts', async () => {
        const container = new Container();
        container.instance('config', { get: () => 'UTC' });

        const scheduler = new Scheduler(container);

        scheduler.define((schedule) => {
            schedule.call(async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }).everyMinute().timeout(1);
        });

        const now = new Date();
        now.setSeconds(0, 0);

        // This should log an error but not throw globally
        await scheduler.run(now);
    });
});
