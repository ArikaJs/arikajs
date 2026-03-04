
import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Mail, MailManager } from '../src';
import { Transport } from '../src/Contracts/Transport';

class MockTransport implements Transport {
    public sent: any[] = [];
    async send(message: any) {
        this.sent.push(message);
    }
}

describe('Mail', () => {
    let mockTransport: MockTransport;

    before(() => {
        mockTransport = new MockTransport();
        const config = {
            default: 'smtp',
            mailers: {
                smtp: {
                    transport: 'smtp', // we will override this logic or use mocked manager
                }
            }
        };

        const manager = new MailManager(config);
        manager.extend('smtp', () => mockTransport);

        Mail.setManager(manager);
    });

    it('sends email via facade', async () => {
        await Mail.to('user@example.com')
            .subject('Hello')
            .text('World')
            .send();

        assert.strictEqual(mockTransport.sent.length, 1);
        assert.strictEqual(mockTransport.sent[0].subject, 'Hello');
        assert.deepStrictEqual(mockTransport.sent[0].to, ['user@example.com']);
    });
});
