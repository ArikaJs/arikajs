
import { Command } from '@arikajs/console';
import { Scheduler } from '@arikajs/scheduler';
import * as path from 'path';
import * as fs from 'fs';

export default class ScheduleTestCommand extends Command {
    public signature: string = 'schedule:test {--task=}';
    public description: string = 'Run a specific scheduled task for testing';

    public async handle() {
        const scheduler = this.container.make(Scheduler);

        // Try to load user defined schedule
        await this.loadSchedule(scheduler);

        const events = (scheduler as any).schedule.allEvents();

        if (events.length === 0) {
            this.info('No scheduled tasks found.');
            return;
        }

        const taskName = this.option('task');

        if (taskName) {
            const event = events.find((e: any) => {
                const name = e.getDescription() || (typeof e.command === 'string' ? e.command : 'closure');
                return name === taskName;
            });

            if (!event) {
                this.error(`No scheduled task found with name [${taskName}].`);
                return;
            }

            await this.runTask(scheduler, event);
            return;
        }

        // Interactive choice if no task provided
        const choices = events.map((e: any, index: number) => {
            const name = e.getDescription() || (typeof e.command === 'string' ? e.command : 'Closure');
            return `${index}: ${name} (${e.expression()})`;
        });

        const selectedIndex = await this.choice('Which task would you like to run?', choices);
        const index = parseInt(selectedIndex.split(':')[0]);
        const selectedEvent = events[index];

        await this.runTask(scheduler, selectedEvent);
    }

    protected async runTask(scheduler: Scheduler, event: any) {
        const name = event.getDescription() || (typeof event.command === 'string' ? event.command : 'Closure');
        this.info(`Running task [${name}]...`);
        
        try {
            await (scheduler as any).runEvent(event);
            this.success('Task finished successfully.');
        } catch (error: any) {
            this.error(`Task failed: ${error.message}`);
        }
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
