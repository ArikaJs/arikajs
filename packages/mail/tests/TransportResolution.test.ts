
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MailManager } from '../src';
import { SesTransport } from '../src/Transport/SesTransport';
import { MailgunTransport } from '../src/Transport/MailgunTransport';
import { SendGridTransport } from '../src/Transport/SendGridTransport';

describe('Mail Transport Resolution', () => {
    const config = {
        default: 'ses',
        mailers: {
            ses: {
                transport: 'ses',
                key: 'test-key',
                secret: 'test-secret',
                region: 'us-east-1'
            },
            mailgun: {
                transport: 'mailgun',
                key: 'mg-key',
                domain: 'mg.example.com'
            },
            sendgrid: {
                transport: 'sendgrid',
                key: 'sg-key'
            }
        }
    };

    it('resolves SES transport', () => {
        const manager = new MailManager(config);
        const mailer = manager.mailer('ses');
        // @ts-ignore - accessing protected for test verification
        assert.ok(mailer.transport instanceof SesTransport);
    });

    it('resolves Mailgun transport', () => {
        const manager = new MailManager(config);
        const mailer = manager.mailer('mailgun');
        // @ts-ignore
        assert.ok(mailer.transport instanceof MailgunTransport);
    });

    it('resolves SendGrid transport', () => {
        const manager = new MailManager(config);
        const mailer = manager.mailer('sendgrid');
        // @ts-ignore
        assert.ok(mailer.transport instanceof SendGridTransport);
    });
});
