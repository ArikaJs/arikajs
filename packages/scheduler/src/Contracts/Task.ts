
export interface Task {
    /**
     * Run the scheduled task.
     */
    run(): Promise<void> | void;

    /**
     * Get the cron expression for the task.
     */
    expression(): string;

    /**
     * Determine if the task is due to run.
     */
    isDue(date: Date, timezone?: string): boolean;
}
