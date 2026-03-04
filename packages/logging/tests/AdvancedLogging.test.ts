
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { LogManager } from '../src/LogManager';
import { Logger as LoggerContract } from '../src/Contracts/Logger';
import { LineFormatter } from '../src/Formatters/LineFormatter';
import fs from 'fs';
import path from 'path';

class MockDriver implements LoggerContract {
    public logs: any[] = [];
    log(level: string, message: string, context?: any): void {
        this.logs.push({ level, message, context });
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

describe('Advanced Logging', () => {
    it('supports shared context', () => {
        const mock = new MockDriver();
        const manager = new LogManager({
            default: 'mock',
            channels: { mock: { driver: 'mock' } }
        });
        manager.extend('mock', () => mock);

        const logger = manager.channel('mock');
        logger.withContext({ userId: 1, traceId: 'abc' });

        logger.info('User logged in');
        logger.error('Payment failed', { amount: 100 });

        assert.strictEqual(mock.logs.length, 2);
        assert.deepStrictEqual(mock.logs[0].context, { userId: 1, traceId: 'abc' });
        assert.deepStrictEqual(mock.logs[1].context, { userId: 1, traceId: 'abc', amount: 100 });
    });

    it('supports JSON formatting in FileDriver', () => {
        const logFile = path.resolve('tests/json_test.log');
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

        const manager = new LogManager({
            default: 'json_file',
            channels: {
                json_file: {
                    driver: 'file',
                    path: logFile,
                    formatter: 'json'
                }
            }
        });

        manager.info('Structured log', { userId: 1, ip: '127.0.0.1' });

        const content = fs.readFileSync(logFile, 'utf8');
        const parsed = JSON.parse(content);

        assert.strictEqual(parsed.level, 'info');
        assert.strictEqual(parsed.message, 'Structured log');
        assert.strictEqual(parsed.userId, 1);
        assert.strictEqual(parsed.ip, '127.0.0.1');
        assert.ok(parsed.timestamp);

        fs.unlinkSync(logFile);
    });

    it('can create a stack driver', () => {
        const mock1 = new MockDriver();
        const mock2 = new MockDriver();

        const manager = new LogManager({
            default: 'stack',
            channels: {
                stack: { driver: 'stack', channels: ['c1', 'c2'] },
                c1: { driver: 'mock1' },
                c2: { driver: 'mock2' }
            }
        });

        manager.extend('mock1', () => mock1);
        manager.extend('mock2', () => mock2);

        manager.warning('Multiple targets');

        assert.strictEqual(mock1.logs.length, 1);
        assert.strictEqual(mock2.logs.length, 1);
        assert.strictEqual(mock1.logs[0].message, 'Multiple targets');
        assert.strictEqual(mock2.logs[0].message, 'Multiple targets');
    });

    it('resolves formatter aliases', () => {
        const manager = new LogManager({
            default: 'c1',
            channels: {
                c1: { driver: 'console', formatter: 'text' },
                c2: { driver: 'console', formatter: 'pretty' }
            }
        });

        const l1 = manager.channel('c1');
        const l2 = manager.channel('c2');

        assert.ok((l1 as any).driver.formatter instanceof LineFormatter);
        assert.ok((l2 as any).driver.formatter instanceof LineFormatter);
    });
});
