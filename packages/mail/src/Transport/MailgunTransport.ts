
import { Transport } from '../Contracts/Transport';
import nodemailer, { Transporter } from 'nodemailer';
const mg = require('nodemailer-mailgun-transport');

export class MailgunTransport implements Transport {
    protected transporter: Transporter;

    constructor(config: any) {
        this.transporter = nodemailer.createTransport(mg({
            auth: {
                api_key: config.key,
                domain: config.domain,
            },
            host: config.host || 'api.mailgun.net',
        }));
    }

    async send(message: any): Promise<void> {
        return await this.transporter.sendMail(message);
    }
}
