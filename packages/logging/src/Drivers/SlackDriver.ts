
import { Logger } from '../Contracts/Logger';
import https from 'https';

export class SlackDriver implements Logger {
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

    constructor(private config: any) {
        if (!config.url) {
            throw new Error('Slack webhook URL is required for Slack driver.');
        }
    }

    log(level: string, message: string, context?: any): void {
        const configLevel = this.config.level || 'critical';
        if (this.levels[level] > this.levels[configLevel]) {
            return;
        }

        const payload = {
            text: `*[${level.toUpperCase()}]* ${message}`,
            attachments: context ? [
                {
                    color: this.getAttachmentColor(level),
                    fields: Object.keys(context).map(key => ({
                        title: key,
                        value: typeof context[key] === 'object' ? JSON.stringify(context[key]) : String(context[key]),
                        short: true
                    }))
                }
            ] : []
        };

        const data = JSON.stringify(payload);

        const req = https.request(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        });

        req.on('error', (error) => {
            console.error('Failed to send log to Slack:', error);
        });

        req.write(data);
        req.end();
    }

    private getAttachmentColor(level: string): string {
        switch (level) {
            case 'emergency':
            case 'alert':
            case 'critical':
                return '#FF0000';
            case 'error':
                return '#E01E5A';
            case 'warning':
                return '#ECB22E';
            case 'info':
                return '#36C5F0';
            case 'debug':
                return '#909090';
            default:
                return '#D0D0D0';
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
