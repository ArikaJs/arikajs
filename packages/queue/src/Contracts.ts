
export interface Job {
    handle(): Promise<void> | void;

    // Optional properties for retry, delay, etc. (future)
}

export interface QueueDriver {
    push(job: Job): Promise<void>;
}
