export interface Attachment {
    filename?: string;
    path?: string;
    content?: any; // String, Buffer, or Stream
    contentType?: string;
    cid?: string;
    encoding?: string;
}

export interface Address {
    name: string;
    address: string;
}

export class Message {
    protected _to: (string | Address)[] = [];
    protected _cc: (string | Address)[] = [];
    protected _bcc: (string | Address)[] = [];
    protected _from?: string | Address;
    protected _replyTo?: string | Address;
    protected _subject?: string;
    protected _text?: string;
    protected _html?: string;
    protected _attachments: Attachment[] = [];

    constructor() { }

    to(address: string | Address | (string | Address)[]) {
        if (Array.isArray(address)) {
            this._to = this._to.concat(address);
        } else {
            this._to.push(address);
        }
        return this;
    }

    cc(address: string | Address | (string | Address)[]) {
        if (Array.isArray(address)) {
            this._cc = this._cc.concat(address);
        } else {
            this._cc.push(address);
        }
        return this;
    }

    bcc(address: string | Address | (string | Address)[]) {
        if (Array.isArray(address)) {
            this._bcc = this._bcc.concat(address);
        } else {
            this._bcc.push(address);
        }
        return this;
    }

    from(address: string | Address) {
        this._from = address;
        return this;
    }

    replyTo(address: string | Address) {
        this._replyTo = address;
        return this;
    }

    subject(subject: string) {
        this._subject = subject;
        return this;
    }

    textContent(content: string) {
        this._text = content;
        return this;
    }

    htmlContent(content: string) {
        this._html = content;
        return this;
    }

    attach(attachment: Attachment) {
        this._attachments.push(attachment);
        return this;
    }

    attachData(data: Buffer | string, filename: string, options: Partial<Attachment> = {}) {
        return this.attach({
            ...options,
            content: data,
            filename
        });
    }

    attachStream(stream: any, filename: string, options: Partial<Attachment> = {}) {
        return this.attach({
            ...options,
            content: stream,
            filename
        });
    }

    getPayload() {
        return {
            to: this._to,
            cc: this._cc,
            bcc: this._bcc,
            from: this._from,
            replyTo: this._replyTo,
            subject: this._subject,
            text: this._text,
            html: this._html,
            attachments: this._attachments,
        };
    }
}
