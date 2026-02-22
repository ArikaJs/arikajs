
import { ServiceProvider } from '@arikajs/foundation';
import { Scheduler } from '@arikajs/scheduler';

export class SchedulerServiceProvider extends ServiceProvider {
    public async register() {
        this.app.singleton(Scheduler, () => {
            return new Scheduler(this.app.getContainer());
        });

        this.app.alias(Scheduler, 'scheduler');
    }

    public async boot() {
        // Here we could automatically load app/Console/Kernel.ts or similar
        // where the user defines their schedule.
    }
}
