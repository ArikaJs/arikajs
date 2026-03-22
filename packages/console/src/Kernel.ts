
import { CommandRegistry } from './CommandRegistry';

/**
 * Base Console Kernel class.
 */
export abstract class Kernel {
    /**
     * The application instance.
     */
    protected app: any;

    /**
     * The command registry.
     */
    protected registry: CommandRegistry;

    constructor(app: any) {
        this.app = app;
        this.registry = app.make('console.registry');
    }

    /**
     * Register the commands for the application.
     */
    protected abstract commands(): void;

    /**
     * Define the application's command schedule.
     */
    protected schedule(scheduler: any): void {
        //
    }

    /**
     * Handle an incoming console command.
     */
    public async handle(args: string[]): Promise<number> {
        this.commands();

        // Let the registry handle the execution
        return await (this.registry as any).run(args);
    }

    /**
     * Run the scheduler.
     */
    public async runSchedule(): Promise<void> {
        if (this.app.has('scheduler')) {
             const scheduler = this.app.make('scheduler');
             this.schedule(scheduler);
             await scheduler.run();
        }
    }
}
