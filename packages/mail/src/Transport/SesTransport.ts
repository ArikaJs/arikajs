import { Transport } from '../Contracts/Transport';
import nodemailer, { Transporter } from 'nodemailer';
import { SES, SendRawEmailCommand } from '@aws-sdk/client-ses';

export class SesTransport implements Transport {
    protected transporter: Transporter;

    constructor(config: any) {
        const ses = new SES({
            apiVersion: '2010-12-01',
            region: config.region,
            credentials: {
                accessKeyId: config.key,
                secretAccessKey: config.secret,
            },
        });

        this.transporter = nodemailer.createTransport({
            SES: { ses, aws: { SendRawEmailCommand } },
        });
    }

    async send(message: any): Promise<void> {
        return await this.transporter.sendMail(message);
    }
}
