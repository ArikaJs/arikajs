
import { Command } from '@arikajs/console';
import { Scheduler } from '@arikajs/scheduler';
import * as path from 'path';
import * as fs from 'fs';

export class ScheduleRunCommand extends Command {
    public signature: string = 'schedule:run';
    public description: string = 'Run the scheduled tasks';

    public async handle() {
        this.info('Running scheduled tasks...');

        try {
            const scheduler = this.container.make(Scheduler);

            // Try to load user defined schedule
            await this.loadSchedule(scheduler);

            await scheduler.run();

            this.success('Scheduled tasks ran successfully.');
        } catch (error: any) {
            this.error(`Failed to run scheduled tasks: ${error.message}`);
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
