
import { Command } from '@arikajs/console';
import { Scheduler, Schedule } from '@arikajs/scheduler';
import * as path from 'path';
import * as fs from 'fs';
import cronParser from 'cron-parser';

export default class ScheduleListCommand extends Command {
    public signature: string = 'schedule:list';
    public description: string = 'List all scheduled tasks';

    public async handle() {
        const scheduler = this.container.make(Scheduler);

        // Try to load user defined schedule
        await this.loadSchedule(scheduler);

        const events = (scheduler as any).schedule.allEvents();

        if (events.length === 0) {
            this.info('No scheduled tasks found.');
            return;
        }

        const table = [
            ['Command / Task', 'Interval', 'Description', 'Next Run']
        ];

        for (const event of events) {
            const command = typeof event.command === 'string' ? event.command : 'Closure';
            const expression = event.expression();
            const description = event.getDescription() || '-';
            
            let nextRun = 'N/A';
            try {
                const interval = cronParser.parseExpression(expression);
                nextRun = interval.next().toString();
            } catch (e) {}

            table.push([command, expression, description, nextRun]);
        }

        this.table(table[0], table.slice(1));
    }

    protected async loadSchedule(scheduler: Scheduler) {
        const schedulePaths = [
            path.join(process.cwd(), 'app/Console/Kernel.ts'),
            path.join(process.cwd(), 'app/Console/Kernel.js'),
            path.join(process.cwd(), 'schedule.ts'),
            path.join(process.cwd(), 'schedule.js'),
        ];

        for (const filePath of schedulePaths) {
            if (fs.existsSync(filePath)) {
                const scheduleModule = await import(filePath);
                const defineSchedule = scheduleModule.default || scheduleModule;

                if (typeof defineSchedule === 'function') {
                    scheduler.define(defineSchedule);
                    return;
                }
            }
        }
    }
}
