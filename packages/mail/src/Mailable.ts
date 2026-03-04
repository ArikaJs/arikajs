
export abstract class Mailable {
    public subjectLine?: string;
    public viewPath?: string;
    public viewData: any = {};
    public textContent?: string;
    public attachments: any[] = [];
    public fromAddress?: string | { name: string; address: string };
    public replyToAddress?: string | { name: string; address: string };

    public ccRecipients: (string | { name: string; address: string })[] = [];
    public bccRecipients: (string | { name: string; address: string })[] = [];

    abstract build(): this;

    public to(address: string | { name: string; address: string } | (string | { name: string; address: string })[]) {
        // Mailable doesn't strictly need a 'to' method if handled by Mail.to()
        // but it's good for self-contained mailables.
        return this;
    }

    public cc(address: string | { name: string; address: string } | (string | { name: string; address: string })[]) {
        if (Array.isArray(address)) {
            this.ccRecipients = this.ccRecipients.concat(address);
        } else {
            this.ccRecipients.push(address);
        }
        return this;
    }

    public bcc(address: string | { name: string; address: string } | (string | { name: string; address: string })[]) {
        if (Array.isArray(address)) {
            this.bccRecipients = this.bccRecipients.concat(address);
        } else {
            this.bccRecipients.push(address);
        }
        return this;
    }

    public subject(subject: string) {
        this.subjectLine = subject;
        return this;
    }

    public view(path: string, data: any = {}) {
        this.viewPath = path;
        this.viewData = data;
        return this;
    }

    public text(content: string) {
        this.textContent = content;
        return this;
    }

    public attach(path: string, options: any = {}) {
        this.attachments.push({ path, ...options });
        return this;
    }

    public attachData(data: any, filename: string, options: any = {}) {
        this.attachments.push({ content: data, filename, ...options });
        return this;
    }

    public attachStream(stream: any, filename: string, options: any = {}) {
        this.attachments.push({ content: stream, filename, ...options });
        return this;
    }

    public from(address: string | { name: string; address: string }) {
        this.fromAddress = address;
        return this;
    }

    public replyTo(address: string | { name: string; address: string }) {
        this.replyToAddress = address;
        return this;
    }
}
