
import { Command } from '@arikajs/console';
import { Scheduler, Worker } from '@arikajs/scheduler';
import * as path from 'path';
import * as fs from 'fs';

export class ScheduleWorkCommand extends Command {
    public signature: string = 'schedule:work';
    public description: string = 'Start the scheduler worker';

    public async handle() {
        this.info('Starting scheduler worker...');

        try {
            const scheduler = this.container.make(Scheduler);

            // Try to load user defined schedule
            await this.loadSchedule(scheduler);

            const worker = new Worker(scheduler);
            await worker.start();

        } catch (error: any) {
            this.error(`Scheduler worker failed: ${error.message}`);
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
                // Determine if we need to use tsx/ts-node for .ts files
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
