import { Mailable } from 'arikajs';

export class ResetPassword extends Mailable {
    constructor(
        private resetUrl: string,
        private appName: string
    ) {
        super();
    }

    public build() {
        return this.subject('Reset Password Notification')
            .view('emails/auth/reset_password', {
                reset_url: this.resetUrl,
                app_name: this.appName,
                year: new Date().getFullYear()
            });
    }
}
