export interface Job {
    handle(): Promise<void> | void;
    connection?: string;
    queue?: string;
    delay?: number | Date;
    tries?: number;
    timeout?: number;
}

export interface QueueDriver {
    push(job: Job, options?: { queue?: string; delay?: number | Date }): Promise<void>;
    pop(queue?: string): Promise<any | null>;
    acknowledge(jobData: any): Promise<void>;
    fail(jobData: any, error: any): Promise<void>;
}
