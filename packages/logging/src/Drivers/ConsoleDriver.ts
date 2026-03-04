import { Logger } from '../Contracts/Logger';
import { Formatter } from '../Contracts/Formatter';
import { LineFormatter } from '../Formatters/LineFormatter';

export class ConsoleDriver implements Logger {
    private colors: Record<string, string> = {
        emergency: '\x1b[41m\x1b[37m', // White on Red
        alert: '\x1b[41m\x1b[37m',     // White on Red
        critical: '\x1b[41m\x1b[37m',  // White on Red
        error: '\x1b[31m',             // Red
        warning: '\x1b[33m',           // Yellow
        notice: '\x1b[34m',            // Blue
        info: '\x1b[32m',              // Green
        debug: '\x1b[90m',             // Gray
    };

    private levels: Record<string, number> = {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
    };

    private formatter: Formatter;

    constructor(private config: any = {}) {
        // If config.formatter was 'pretty', LogManager might have returned a default LineFormatter.
        // We want to ensure ConsoleDriver uses colors for 'pretty' or default.
        if (!config.formatter || (typeof config._rawFormatter === 'string' && config._rawFormatter === 'pretty')) {
            this.formatter = new LineFormatter(this.colors);
        } else {
            this.formatter = config.formatter;
        }
    }

    log(level: string, message: string, context?: any): void {
        const configLevel = this.config.level || 'debug';
        if (this.levels[level] > this.levels[configLevel]) {
            return;
        }

        const output = this.formatter.format(level, message, context);

        switch (level) {
            case 'emergency':
            case 'alert':
            case 'critical':
            case 'error':
                console.error(output);
                break;
            case 'warning':
                console.warn(output);
                break;
            case 'info':
            case 'notice':
                console.info(output);
                break;
            case 'debug':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
    }

    emergency(message: string, context?: any): void { this.log('emergency', message, context); }
    alert(message: string, context?: any): void { this.log('alert', message, context); }
    critical(message: string, context?: any): void { this.log('critical', message, context); }
    error(message: string, context?: any): void { this.log('error', message, context); }
    warning(message: string, context?: any): void { this.log('warning', message, context); }
    notice(message: string, context?: any): void { this.log('notice', message, context); }
    info(message: string, context?: any): void { this.log('info', message, context); }
    debug(message: string, context?: any): void { this.log('debug', message, context); }
}
