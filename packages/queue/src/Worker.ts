import { Job } from './Contracts';

export class Worker {
    private static jobClasses: Map<string, any> = new Map();
    private isRunning: boolean = true;

    constructor(private driver: any, private options: { queue?: string; sleep?: number } = {}) { }

    public static registerJob(name: string, jobClass: any) {
        this.jobClasses.set(name, jobClass);
    }

    public async run() {
        while (this.isRunning) {
            const jobData = await this.driver.pop(this.options.queue || 'default');

            if (jobData) {
                const startTime = Date.now();
                const jobName = jobData.payload.job;
                const dateString = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

                console.log(`[\x1b[90m${dateString}\x1b[0m] \x1b[33mProcessing:\x1b[0m ${jobName}`);

                try {
                    await this.process(jobData);
                    await this.driver.acknowledge(jobData);

                    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log(`[\x1b[90m${dateString}\x1b[0m] \x1b[32mProcessed:\x1b[0m  ${jobName} (${duration}s)`);
                } catch (error: any) {
                    await this.driver.fail(jobData, error);
                    console.log(`[\x1b[90m${dateString}\x1b[0m] \x1b[31mFailed:\x1b[0m     ${jobName}`);
                    console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, (this.options.sleep || 3) * 1000));
            }
        }
    }

    public stop() {
        this.isRunning = false;
    }

    async process(jobData: any) {
        const jobName = jobData.payload.job;
        const JobClass = Worker.jobClasses.get(jobName);

        if (!JobClass) {
            throw new Error(`Job class [${jobName}] not registered with Worker.`);
        }

        const job = new JobClass();
        // Fill job properties from data
        if (jobData.payload.data) {
            Object.assign(job, jobData.payload.data);
        }

        await job.handle();
    }
}
