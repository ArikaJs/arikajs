export interface CanVerifyEmail {
    /**
     * Determine if the user has verified their email address.
     */
    hasVerifiedEmail(): boolean;

    /**
     * Mark the given user's email as verified.
     */
    markEmailAsVerified(): Promise<boolean>;

    /**
     * Get the email address that should be used for verification.
     */
    getEmailForVerification(): string;

    /**
     * Send the email verification notification.
     */
    sendEmailVerificationNotification(): Promise<void>;
}
