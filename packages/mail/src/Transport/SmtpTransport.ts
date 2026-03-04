
import { Transport } from '../Contracts/Transport';
import nodemailer, { Transporter } from 'nodemailer';

export class SmtpTransport implements Transport {
    protected transporter: Transporter;



    constructor(config: any) {
        const options: any = {
            host: config.host,
            port: config.port,
            secure: config.encryption === 'ssl',
            auth: {
                user: config.username,
                pass: config.password,
            },
        };

        const defaults: any = {};
        if (config.from) {
            defaults.from = config.from;
        }

        this.transporter = nodemailer.createTransport(options, defaults);
    }


    async send(message: any): Promise<void> {
        return await this.transporter.sendMail(message);
    }
}
