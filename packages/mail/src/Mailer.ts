
import { Transport } from './Contracts/Transport';
import { Mailable } from './Mailable';
import { Message, Attachment, Address } from './Message';

export interface ViewRenderer {
    render(view: string, data: any): Promise<string>;
}

export class Mailer {
    constructor(
        protected name: string,
        protected transport: Transport,
        protected viewRenderer?: ViewRenderer,
        protected manager?: any
    ) { }

    to(users: string | Address | (string | Address)[]) {
        return new PendingMail(this).to(users);
    }

    cc(users: string | Address | (string | Address)[]) {
        return new PendingMail(this).cc(users);
    }

    bcc(users: string | Address | (string | Address)[]) {
        return new PendingMail(this).bcc(users);
    }

    async send(viewPath: string, data: any, callback: (message: Message) => void) {
        const message = new Message();
        callback(message);

        if (viewPath && this.viewRenderer) {
            const html = await this.viewRenderer.render(viewPath, data);
            message.htmlContent(html);
        }

        return this.transport.send(message.getPayload());
    }

    async sendMailable(mailable: Mailable) {
        return this.sendRaw(mailable);
    }

    async sendRaw(message: any) {
        return this.transport.send(message);
    }

    getRenderer() {
        return this.viewRenderer;
    }

    getQueue() {
        return this.manager?.getQueue();
    }
}

export class PendingMail {
    protected message: Message;
    protected viewPath?: string;
    protected viewData: any = {};

    constructor(protected mailer: Mailer) {
        this.message = new Message();
    }

    to(users: string | Address | (string | Address)[]) {
        this.message.to(users);
        return this;
    }

    cc(users: string | Address | (string | Address)[]) {
        this.message.cc(users);
        return this;
    }

    bcc(users: string | Address | (string | Address)[]) {
        this.message.bcc(users);
        return this;
    }

    subject(subject: string) {
        this.message.subject(subject);
        return this;
    }

    replyTo(address: string | Address) {
        this.message.replyTo(address);
        return this;
    }

    text(content: string) {
        this.message.textContent(content);
        return this;
    }

    view(path: string, data: any = {}) {
        this.viewPath = path;
        this.viewData = data;
        return this;
    }

    attach(path: string, options: any = {}) {
        this.message.attach({ path, ...options });
        return this;
    }

    attachData(data: any, filename: string, options: any = {}) {
        this.message.attachData(data, filename, options);
        return this;
    }

    attachStream(stream: any, filename: string, options: any = {}) {
        this.message.attachStream(stream, filename, options);
        return this;
    }

    async send(mailable?: Mailable) {
        if (mailable) {
            mailable.build();

            if (mailable.subjectLine) this.message.subject(mailable.subjectLine);
            if (mailable.fromAddress) this.message.from(mailable.fromAddress);
            if (mailable.replyToAddress) this.message.replyTo(mailable.replyToAddress);
            if (mailable.textContent) this.message.textContent(mailable.textContent);

            if (mailable.viewPath) {
                this.viewPath = mailable.viewPath;
                this.viewData = mailable.viewData;
            }

            if (mailable.attachments) {
                mailable.attachments.forEach(att => this.message.attach(att));
            }

            if (mailable.ccRecipients) {
                this.message.cc(mailable.ccRecipients);
            }

            if (mailable.bccRecipients) {
                this.message.bcc(mailable.bccRecipients);
            }
        }

        if (this.viewPath) {
            const renderer = this.mailer.getRenderer();
            if (renderer) {
                const html = await renderer.render(this.viewPath, this.viewData);
                this.message.htmlContent(html);
            }
        }

        return this.mailer.sendRaw(this.message.getPayload());
    }

    async queue(mailable?: Mailable) {
        const queue = this.mailer.getQueue();

        if (!queue) {
            throw new Error('Queue not configured. Please use Mail.setQueue() to enable queued emails.');
        }

        // We'll use a special "MailableWrapper" or just serialize the data.
        // For simplicity, we'll implement a basic job dispatch.
        // Importing the job here to avoid circular dependencies if any.
        const { SendQueuedMailable } = require('./Jobs/SendQueuedMailable');

        return queue.dispatch(new SendQueuedMailable(mailable || this.prepareMessage(), this.mailer['name']));
    }

    protected prepareMessage(): any {
        // Logic to finalize the message object before sending/queueing
        return this.message.getPayload();
    }
}
