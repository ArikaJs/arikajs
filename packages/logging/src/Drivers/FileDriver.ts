import { Logger } from '../Contracts/Logger';
import { Formatter } from '../Contracts/Formatter';
import { LineFormatter } from '../Formatters/LineFormatter';
import fs from 'fs';
import path from 'path';

export class FileDriver implements Logger {
    private filePath: string;

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

    constructor(private config: any) {
        this.filePath = config.path || 'app.log';
        this.ensureFileExists();
        this.formatter = config.formatter || new LineFormatter();
    }

    private ensureFileExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    log(level: string, message: string, context?: any): void {
        const configLevel = this.config.level || 'debug';
        if (this.levels[level] > this.levels[configLevel]) {
            return;
        }

        const line = this.formatter.format(level, message, context) + '\n';

        fs.appendFileSync(this.filePath, line);
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
