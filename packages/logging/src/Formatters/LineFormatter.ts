
import { Formatter } from '../Contracts/Formatter';

export class LineFormatter implements Formatter {
    constructor(private colors: Record<string, string> = {}) { }

    format(level: string, message: string, context?: any): string {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        const color = this.colors[level] || '';
        const reset = color ? '\x1b[0m' : '';
        const contextStr = context ? ' ' + JSON.stringify(context) : '';

        return `[${timestamp}] ${color}${level.toUpperCase()}${reset}: ${message}${contextStr}`;
    }
}
