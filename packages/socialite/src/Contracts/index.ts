
export interface User {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    avatar?: string;
    token: string;
    refreshToken?: string;
    expiresIn?: number;
    user: any; // Raw user data from provider
}

export interface Provider {
    /**
     * Redirect the user to the authentication page for the provider.
     */
    redirect(): Promise<any>;

    /**
     * Get the User instance for the authenticated user.
     */
    user(): Promise<User>;

    /**
     * Set the request instance.
     */
    setRequest(request: any): this;

    /**
     * Indicate that the provider should skip state validation.
     */
    stateless(): this;

    /**
     * Set the scopes of the requested permissions.
     */
    scopes(scopes: string[]): this;
}
