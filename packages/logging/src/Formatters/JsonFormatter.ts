
import { Formatter } from '../Contracts/Formatter';

export class JsonFormatter implements Formatter {
    format(level: string, message: string, context?: any): string {
        const payload: any = {
            timestamp: new Date().toISOString(),
            level,
            message,
        };

        if (context) {
            Object.assign(payload, context);
        }

        return JSON.stringify(payload);
    }
}
