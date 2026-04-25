
import { Command } from '@arikajs/console';
import { Scheduler } from '@arikajs/scheduler';
import * as path from 'path';
import * as fs from 'fs';

export class ScheduleRunCommand extends Command {
    public signature: string = 'schedule:run {task?}';
    public description: string = 'Run the scheduled tasks';

    public async handle() {
        const taskName = this.argument('task');
        
        try {
            const scheduler = this.container.make(Scheduler);
            await this.loadSchedule(scheduler);

            if (taskName) {
                this.info(`Running specific scheduled task [${taskName}]...`);
                const events = (scheduler as any).schedule.allEvents();
                const event = events.find((e: any) => {
                    const name = e.getDescription() || (typeof e.command === 'string' ? e.command : 'closure');
                    return name === taskName;
                });

                if (!event) {
                    this.error(`No scheduled task found with name [${taskName}].`);
                    return;
                }

                await (scheduler as any).runEvent(event);
                this.success(`Task [${taskName}] ran successfully.`);
                return;
            }

            this.info('Running all due scheduled tasks...');
            await scheduler.run();
            this.success('Due tasks completed.');
        } catch (error: any) {
            this.error(`Execution failed: ${error.message}`);
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
