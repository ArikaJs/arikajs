
import { Transport } from '../Contracts/Transport';
import * as sgMail from '@sendgrid/mail';

export class SendGridTransport implements Transport {
    constructor(config: any) {
        sgMail.setApiKey(config.key);
    }

    async send(message: any): Promise<void> {
        const payload = {
            to: message.to,
            cc: message.cc,
            bcc: message.bcc,
            from: message.from,
            replyTo: message.replyTo,
            subject: message.subject,
            text: message.text,
            html: message.html,
            attachments: message.attachments?.map((attachment: any) => ({
                content: attachment.content?.toString('base64'),
                filename: attachment.filename,
                type: attachment.contentType,
                disposition: 'attachment',
                contentId: attachment.cid
            }))
        };

        await (sgMail as any).send(payload);
    }
}
