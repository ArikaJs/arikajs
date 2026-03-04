
import { Task } from './Contracts/Task';
import cronParser from 'cron-parser';

export class Event implements Task {
    protected cronExpression: string = '* * * * *';
    protected timezoneVal?: string;
    protected withoutOverlappingVal: boolean = false;
    protected expiresAt: number = 1440; // 24 hours default for overlap lock
    protected successCallbacks: Function[] = [];
    protected failureCallbacks: (Function)[] = [];
    protected timeoutVal: number = 0;
    protected retriesVal: number = 0;
    protected retryDelayVal: number = 0;
    protected descriptionVal: string = '';

    constructor(public readonly command: string | Function) { }

    public name(description: string): this {
        this.descriptionVal = description;
        return this;
    }

    public timeout(seconds: number): this {
        this.timeoutVal = seconds;
        return this;
    }

    public retry(times: number, delay: number = 0): this {
        this.retriesVal = times;
        this.retryDelayVal = delay;
        return this;
    }

    public cron(expression: string): this {
        this.cronExpression = expression;
        return this;
    }

    public timezone(timezone: string): this {
        this.timezoneVal = timezone;
        return this;
    }

    public withoutOverlapping(expiresAt: number = 1440): this {
        this.withoutOverlappingVal = true;
        this.expiresAt = expiresAt;
        return this;
    }

    public onSuccess(callback: Function): this {
        this.successCallbacks.push(callback);
        return this;
    }

    public onFailure(callback: Function): this {
        this.failureCallbacks.push(callback);
        return this;
    }

    // Frequencies
    public everySecond(): this { return this.cron('* * * * * *'); }
    public everyMinute(): this { return this.cron('* * * * *'); }
    public everyFiveMinutes(): this { return this.cron('*/5 * * * *'); }
    public everyTenMinutes(): this { return this.cron('*/10 * * * *'); }
    public hourly(): this { return this.cron('0 * * * *'); }
    public hourlyAt(minute: number): this { return this.cron(`${minute} * * * *`); }
    public daily(): this { return this.cron('0 0 * * *'); }
    public dailyAt(time: string): this {
        const [hour, minute] = time.split(':');
        return this.cron(`${minute} ${hour} * * *`);
    }
    public weekly(): this { return this.cron('0 0 * * 0'); }
    public weeklyOn(day: number, time: string = '00:00'): this {
        const [hour, minute] = time.split(':');
        return this.cron(`${minute} ${hour} * * ${day}`);
    }
    public monthly(): this { return this.cron('0 0 1 * *'); }
    public monthlyOn(day: number, time: string = '00:00'): this {
        const [hour, minute] = time.split(':');
        return this.cron(`${minute} ${hour} ${day} * *`);
    }

    public expression(): string {
        return this.cronExpression;
    }

    public isDue(date: Date, timezone?: string): boolean {
        const options = {
            currentDate: new Date(date.getTime() - 1000),
            tz: this.timezoneVal || timezone
        };

        try {
            const interval = cronParser.parseExpression(this.cronExpression, options);
            const next = interval.next().toDate();

            return next.getMinutes() === date.getMinutes() &&
                next.getHours() === date.getHours() &&
                next.getDate() === date.getDate() &&
                next.getMonth() === date.getMonth() &&
                next.getFullYear() === date.getFullYear();
        } catch (e) {
            return false;
        }
    }

    public async run(): Promise<void> {
        try {
            if (typeof this.command === 'function') {
                await this.command();
            } else {
                // For commands, we would usually use the CommandRegistry
                // But this will be handled by the Scheduler runner
            }

            for (const callback of this.successCallbacks) {
                await callback();
            }
        } catch (e) {
            for (const callback of this.failureCallbacks) {
                await callback(e);
            }
            throw e;
        }
    }

    public shouldSkipOverlapping(): boolean {
        return this.withoutOverlappingVal;
    }

    public mutexExpiration(): number {
        return this.expiresAt;
    }

    public getTimeout(): number {
        return this.timeoutVal;
    }

    public getRetries(): number {
        return this.retriesVal;
    }

    public getRetryDelay(): number {
        return this.retryDelayVal;
    }

    public getDescription(): string {
        return this.descriptionVal;
    }
}
