
export class SendQueuedMailable {
    constructor(
        public mailable: any,
        public mailerName?: string
    ) { }

    async handle(container: any) {
        // Resolve mail manager from container
        const mailManager = container.make('mail');
        const mailer = mailManager.mailer(this.mailerName);

        // If mailable is a raw payload (from PendingMail.prepareMessage())
        if (this.mailable && !this.mailable.build) {
            return mailer.sendRaw(this.mailable);
        }

        // If it's a mailable instance
        // NOTE: In a real distributed system, we'd need to re-instantiate 
        // the class and restore properties. For simple local/redis queue, 
        // it depends on how the job is serialized.

        // Ensure to recipients are handled if they were set on the PendingMail before queue()
        return mailer.sendMailable(this.mailable);
    }
}
