import { Mailable } from 'arikajs';

export class VerifyEmail extends Mailable {
    constructor(
        private name: string,
        private verificationUrl: string,
        private appName: string
    ) {
        super();
    }

    public build() {
        return this.subject('Verify Your Email Address')
            .view('emails/auth/verify_email', {
                name: this.name,
                verification_url: this.verificationUrl,
                app_name: this.appName,
                year: new Date().getFullYear()
            });
    }
}
