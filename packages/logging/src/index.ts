
import { LogManager } from './LogManager';
import { Logger } from './Contracts/Logger';

let logManager: LogManager;

export class Log {
    public static setManager(manager: LogManager) {
        logManager = manager;
    }

    protected static getManager(): LogManager {
        if (!logManager) {
            throw new Error('Log system not configured. Please use Log.setManager() to configure.');
        }
        return logManager;
    }

    public static channel(name?: string) {
        return this.getManager().channel(name);
    }

    public static emergency(message: string, context?: any): void { this.getManager().emergency(message, context); }
    public static alert(message: string, context?: any): void { this.getManager().alert(message, context); }
    public static critical(message: string, context?: any): void { this.getManager().critical(message, context); }
    public static error(message: string, context?: any): void { this.getManager().error(message, context); }
    public static warning(message: string, context?: any): void { this.getManager().warning(message, context); }
    public static notice(message: string, context?: any): void { this.getManager().notice(message, context); }
    public static info(message: string, context?: any): void { this.getManager().info(message, context); }
    public static debug(message: string, context?: any): void { this.getManager().debug(message, context); }
    public static log(level: string, message: string, context?: any): void { this.getManager().log(level, message, context); }
}

export { LogManager, Logger };
export { ConsoleDriver } from './Drivers/ConsoleDriver';
export { FileDriver } from './Drivers/FileDriver';
export { DailyDriver } from './Drivers/DailyDriver';
