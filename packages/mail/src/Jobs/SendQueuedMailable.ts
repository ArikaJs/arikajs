import { BaseJob } from '@arikajs/queue';

export class SendQueuedMailable extends BaseJob {
    constructor(
        public mailable: any,
        public mailerName?: string
    ) {
        super();
    }

    async handle() {
        // Resolve mail manager from container
        const { app } = require('arikajs');
        const mailManager = app().make('mail');
        const mailer = mailManager.mailer(this.mailerName);

        // If it's a mailable instance/payload
        if (this.mailable && (this.mailable.toRecipients || this.mailable.viewPath)) {
            let pending = mailer.to(this.mailable.toRecipients || []);
            if (this.mailable.ccRecipients && this.mailable.ccRecipients.length > 0) {
                pending = pending.cc(this.mailable.ccRecipients);
            }
            if (this.mailable.bccRecipients && this.mailable.bccRecipients.length > 0) {
                pending = pending.bcc(this.mailable.bccRecipients);
            }
            return pending.send(this.mailable);
        }

        // Ensure recipients are handled if they were set on the PendingMail before queue()
        return mailer.sendMailable(this.mailable);
    }
}
