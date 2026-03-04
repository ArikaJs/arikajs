export interface RateLimiter {
    /**
     * Determine if the key has too many attempts
     */
    tooManyAttempts(key: string, maxAttempts: number): Promise<boolean>;

    /**
     * Hit the rate limiter for a given key
     */
    hit(key: string, decayMinutes?: number): Promise<number>;

    /**
     * Clear the attempts for a given key
     */
    clear(key: string): Promise<void>;
}
