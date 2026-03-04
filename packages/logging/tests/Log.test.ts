
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { Log, LogManager } from '../src';

describe('Logging', () => {
    const logPath = path.join(__dirname, 'test.log');

    before(() => {
        const config = {
            default: 'stack',
            channels: {
                stack: {
                    driver: 'stack',
                    channels: ['console', 'file']
                },
                console: {
                    driver: 'console'
                },
                file: {
                    driver: 'file',
                    path: logPath
                }
            }
        };

        const manager = new LogManager(config);
        Log.setManager(manager);
    });

    after(() => {
        if (fs.existsSync(logPath)) {
            fs.unlinkSync(logPath);
        }
    });

    it('logs to the default stack channel', () => {
        const message = 'Test message';
        Log.info(message);

        assert.ok(fs.existsSync(logPath), 'Log file should exist');
        const content = fs.readFileSync(logPath, 'utf8');
        assert.ok(content.includes('INFO: Test message'), 'Log content should include the message');
    });

    it('logs to a specific channel', () => {
        const message = 'Console only message';
        // We can't easily assert console output in this environment without mocking console,
        // but we can at least ensure it doesn't throw and doesn't end up in the file if we only use console channel.

        Log.channel('console').info(message);

        const content = fs.readFileSync(logPath, 'utf8');
        assert.ok(!content.includes(message), 'Console only message should not be in the file');
    });

    it('logs with context', () => {
        const message = 'Message with context';
        const context = { user: 'test-user' };
        Log.info(message, context);

        const content = fs.readFileSync(logPath, 'utf8');
        assert.ok(content.includes('{"user":"test-user"}'), 'Log content should include context');
    });
});
