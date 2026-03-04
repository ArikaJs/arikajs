export interface CanResetPassword {
    /**
     * Get the email address where password reset links are sent.
     */
    getEmailForPasswordReset(): string;

    /**
     * Send the password reset notification.
     */
    sendPasswordResetNotification(token: string): Promise<void>;
}
