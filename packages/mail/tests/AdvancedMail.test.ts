
import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Mail, MailManager, Mailable } from '../src';
import { Transport } from '../src/Contracts/Transport';
import { Readable } from 'stream';

class MockTransport implements Transport {
    public sent: any[] = [];
    async send(message: any) {
        this.sent.push(message);
    }
}

class TestMailable extends Mailable {
    build() {
        return this.subject('Test Mailable')
            .text('Hello Mailable')
            .cc('cc@example.com')
            .bcc(['bcc1@example.com', 'bcc2@example.com']);
    }
}

describe('Advanced Mail Features', () => {
    let mockTransport: MockTransport;

    before(() => {
        mockTransport = new MockTransport();
        const config = {
            default: 'smtp',
            mailers: {
                smtp: { transport: 'smtp' }
            }
        };

        const manager = new MailManager(config);
        manager.extend('smtp', () => mockTransport);
        Mail.setManager(manager);
    });

    it('can send with cc and bcc', async () => {
        await Mail.to('to@example.com')
            .cc('cc@example.com')
            .bcc('bcc@example.com')
            .subject('Testing CC/BCC')
            .text('Body')
            .send();

        const last = mockTransport.sent[mockTransport.sent.length - 1];
        assert.deepStrictEqual(last.to, ['to@example.com']);
        assert.deepStrictEqual(last.cc, ['cc@example.com']);
        assert.deepStrictEqual(last.bcc, ['bcc@example.com']);
    });

    it('can set replyTo', async () => {
        await Mail.to('to@example.com')
            .replyTo('support@example.com')
            .subject('Reply Test')
            .text('Body')
            .send();

        const last = mockTransport.sent[mockTransport.sent.length - 1];
        assert.strictEqual(last.replyTo, 'support@example.com');
    });

    it('can send mailable with cc and bcc', async () => {
        const mailable = new TestMailable();
        await Mail.to('to@example.com').send(mailable);

        const last = mockTransport.sent[mockTransport.sent.length - 1];
        assert.strictEqual(last.subject, 'Test Mailable');
        assert.deepStrictEqual(last.cc, ['cc@example.com']);
        assert.deepStrictEqual(last.bcc, ['bcc1@example.com', 'bcc2@example.com']);
    });

    it('can queue emails', async () => {
        const mockQueue = {
            dispatched: [] as any[],
            async dispatch(job: any) {
                this.dispatched.push(job);
            }
        };

        Mail.setQueue(mockQueue);

        await Mail.to('queue@example.com')
            .subject('Queued')
            .text('Async')
            .queue();

        assert.strictEqual(mockQueue.dispatched.length, 1);
        const job = mockQueue.dispatched[0];
        assert.strictEqual(job.constructor.name, 'SendQueuedMailable');
        assert.strictEqual(job.mailerName, 'smtp');
        assert.strictEqual(job.mailable.subject, 'Queued');
    });

    it('can attach raw data (Buffer)', async () => {
        const buffer = Buffer.from('hello world');
        await Mail.to('test@example.com')
            .subject('Buffer Test')
            .attachData(buffer, 'test.txt')
            .send();

        const last = mockTransport.sent[mockTransport.sent.length - 1];
        assert.strictEqual(last.attachments.length, 1);
        assert.strictEqual(last.attachments[0].filename, 'test.txt');
        assert.deepStrictEqual(last.attachments[0].content, buffer);
    });

    it('can attach streams', async () => {
        const stream = Readable.from(['stream data']);
        await Mail.to('test@example.com')
            .subject('Stream Test')
            .attachStream(stream, 'test.csv')
            .send();

        const last = mockTransport.sent[mockTransport.sent.length - 1];
        assert.strictEqual(last.attachments.length, 1);
        assert.strictEqual(last.attachments[0].filename, 'test.csv');
        assert.strictEqual(last.attachments[0].content, stream);
    });
});
