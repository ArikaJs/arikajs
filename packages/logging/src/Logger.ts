
import { Logger as LoggerContract } from './Contracts/Logger';

export class Logger implements LoggerContract {
    protected sharedContext: any = {};

    constructor(protected driver: LoggerContract) { }

    public withContext(context: any): this {
        this.sharedContext = { ...this.sharedContext, ...context };
        return this;
    }

    protected getMergedContext(context?: any): any {
        if (!context && Object.keys(this.sharedContext).length === 0) {
            return undefined;
        }
        return { ...this.sharedContext, ...context };
    }

    emergency(message: string, context?: any): void { this.driver.emergency(message, this.getMergedContext(context)); }
    alert(message: string, context?: any): void { this.driver.alert(message, this.getMergedContext(context)); }
    critical(message: string, context?: any): void { this.driver.critical(message, this.getMergedContext(context)); }
    error(message: string, context?: any): void { this.driver.error(message, this.getMergedContext(context)); }
    warning(message: string, context?: any): void { this.driver.warning(message, this.getMergedContext(context)); }
    notice(message: string, context?: any): void { this.driver.notice(message, this.getMergedContext(context)); }
    info(message: string, context?: any): void { this.driver.info(message, this.getMergedContext(context)); }
    debug(message: string, context?: any): void { this.driver.debug(message, this.getMergedContext(context)); }
    log(level: string, message: string, context?: any): void { this.driver.log(level, message, this.getMergedContext(context)); }
}
