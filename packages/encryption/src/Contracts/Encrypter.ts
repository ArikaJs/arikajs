export interface Encrypter {
    /**
     * Encrypt the given value.
     */
    encrypt(value: any, options?: { serialize?: boolean, compress?: boolean, ttl?: number, context?: string }): string;

    /**
     * Decrypt the given value.
     */
    decrypt(payload: string, options?: { unserialize?: boolean, context?: string }): any;
    /**
     * Sign the given value.
     */
    sign(value: any): string;

    /**
     * Verify the given signed payload.
     */
    verify(payload: string): any;
}
