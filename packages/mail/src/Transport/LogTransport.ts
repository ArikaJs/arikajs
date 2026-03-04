import { Transport } from '../Contracts/Transport';
import fs from 'fs';
import path from 'path';

export class LogTransport implements Transport {
    async send(message: any): Promise<void> {
        const to = Array.isArray(message.to)
            ? message.to.map((r: any) => (typeof r === 'string' ? r : r.address)).join(', ')
            : (typeof message.to === 'string' ? message.to : message.to?.address ?? '');

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logLine = [
            `[${timestamp}] DEBUG: [Mail] To: ${to} | Subject: ${message.subject ?? '(no subject)'}`,
            `[${timestamp}] DEBUG: [Mail] Payload: ${JSON.stringify(message, null, 2)}`,
            ''
        ].join('\n');

        // Write to storage/logs/arika.log (application root)
        const logDir = path.join(process.cwd(), 'storage', 'logs');
        const logFile = path.join(logDir, 'arika.log');

        try {
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
            fs.appendFileSync(logFile, logLine);
        } catch {
            // Fallback to console if file write fails
            console.log('[Mail Log]', logLine);
        }
    }
}

