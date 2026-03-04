export interface PasswordBroker {
    /**
     * Send a password reset link to a user.
     */
    sendResetLink(credentials: Record<string, any>): Promise<string>;

    /**
     * Reset the password for the given token.
     */
    reset(credentials: Record<string, any>, callback: (user: any, password: string) => Promise<void>): Promise<string>;
}

export const PasswordResetStatus = {
    RESET_LINK_SENT: 'passwords.sent',
    RESET_THROTTLED: 'passwords.throttled',
    INVALID_USER: 'passwords.user',
    INVALID_TOKEN: 'passwords.token',
    PASSWORD_RESET: 'passwords.reset',
};
