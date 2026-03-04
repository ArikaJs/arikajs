
import { Mailer, ViewRenderer } from './Mailer';
import { SmtpTransport } from './Transport/SmtpTransport';
import { LogTransport } from './Transport/LogTransport';
import { ArrayTransport } from './Transport/ArrayTransport';

export class MailManager {
    private mailers: Map<string, Mailer> = new Map();

    private customCreators: Map<string, (config: any) => any> = new Map();
    private queue: any;

    constructor(private config: any, private viewRenderer?: ViewRenderer) { }

    public setQueue(queue: any) {
        this.queue = queue;
        return this;
    }

    public getQueue() {
        return this.queue;
    }

    public extend(driver: string, callback: (config: any) => any) {
        this.customCreators.set(driver, callback);
        return this;
    }

    public mailer(name?: string): Mailer {
        const mailerName = name || this.config.default;

        if (!this.mailers.has(mailerName)) {
            this.mailers.set(mailerName, this.resolve(mailerName));
        }

        return this.mailers.get(mailerName)!;
    }

    protected resolve(name: string): Mailer {
        const config = this.config.mailers[name];

        if (!config) {
            throw new Error(`Mailer [${name}] is not defined.`);
        }

        let transport;

        if (this.customCreators.has(config.transport)) {
            transport = this.customCreators.get(config.transport)!(config);
        } else {
            switch (config.transport) {
                case 'smtp':
                    transport = new SmtpTransport(config);
                    break;
                case 'ses':
                    const { SesTransport } = require('./Transport/SesTransport');
                    transport = new SesTransport(config);
                    break;
                case 'mailgun':
                    const { MailgunTransport } = require('./Transport/MailgunTransport');
                    transport = new MailgunTransport(config);
                    break;
                case 'sendgrid':
                    const { SendGridTransport } = require('./Transport/SendGridTransport');
                    transport = new SendGridTransport(config);
                    break;
                case 'log':
                    transport = new LogTransport();
                    break;
                case 'array':
                    transport = new ArrayTransport();
                    break;
                default:
                    throw new Error(`Unsupported transport driver [${config.transport}].`);
            }
        }

        return new Mailer(name, transport, this.viewRenderer, this);
    }

    public to(users: any) {
        return this.mailer().to(users);
    }
}
