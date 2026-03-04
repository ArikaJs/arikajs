import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { Encrypter as EncrypterContract } from './Contracts/Encrypter';
import { DecryptionException } from './Exceptions/DecryptionException';

export class Encrypter implements EncrypterContract {
    private readonly keys: Buffer[];
    private readonly cipher = 'aes-256-gcm';

    constructor(key: string | string[]) {
        const keys = Array.isArray(key) ? key : [key];
        this.keys = keys.map(k => this.parseKey(k));

        if (this.keys.length === 0) {
            throw new Error('At least one encryption key must be provided.');
        }

        for (const k of this.keys) {
            if (k.length !== 32) {
                throw new Error('Each encryption key must be 32 bytes.');
            }
        }
    }

    /**
     * Parse the encryption key.
     */
    protected parseKey(key: string): Buffer {
        if (key.startsWith('base64:')) {
            return Buffer.from(key.substring(7), 'base64');
        }

        return Buffer.from(key);
    }

    /**
     * Encrypt the given value.
     */
    public encrypt(value: any, options: { serialize?: boolean, compress?: boolean, ttl?: number, context?: string } = {}): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.cipher, this.keys[0], iv);

        if (options.context) {
            cipher.setAAD(Buffer.from(options.context));
        }

        const serialize = options.serialize !== false;
        let data: string | Buffer;

        if (serialize) {
            data = JSON.stringify(value);
        } else {
            data = Buffer.isBuffer(value) ? value : String(value);
        }

        if (options.compress === true) {
            data = deflateSync(Buffer.from(data));
        }

        let encrypted = cipher.update(data as any);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const tag = cipher.getAuthTag();

        const payload: any = {
            iv: iv.toString('base64'),
            value: encrypted.toString('base64'),
            tag: tag.toString('base64'),
            v: 1,
        };

        if (options.compress) payload.c = true;
        if (options.ttl) {
            payload.exp = Date.now() + (options.ttl * 1000);
        }
        if (options.context) payload.aad = true;

        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    /**
     * Decrypt the given value.
     */
    public decrypt(payload: string, options: { unserialize?: boolean, context?: string } = {}): any {
        const jsonPayload = this.getJsonPayload(payload);

        // Check for TTL expiration
        if (jsonPayload.exp && Date.now() > jsonPayload.exp) {
            throw new DecryptionException('The payload has expired.');
        }

        // Verify context requirements
        if (jsonPayload.aad && !options.context) {
            throw new DecryptionException('The payload requires a context for decryption.');
        }

        const iv = Buffer.from(jsonPayload.iv, 'base64');
        const tag = Buffer.from(jsonPayload.tag, 'base64');
        const value = jsonPayload.value;
        const compressed = jsonPayload.c === true;

        // Try decrypting with all available keys (support rotation)
        for (const key of this.keys) {
            try {
                const decipher = createDecipheriv(this.cipher, key, iv);

                if (options.context) {
                    decipher.setAAD(Buffer.from(options.context));
                }

                decipher.setAuthTag(tag);

                let decrypted = decipher.update(value, 'base64');
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                let result: Buffer = decrypted;
                if (compressed) {
                    result = inflateSync(result);
                }

                const finalData = result.toString('utf8');
                return options.unserialize === false ? finalData : JSON.parse(finalData);
            } catch (error) {
                // Try next key
                continue;
            }
        }

        throw new DecryptionException();
    }

    /**
     * Sign the given value (non-encrypted but authenticated).
     */
    public sign(value: any): string {
        const jsonValue = JSON.stringify(value);
        const signature = this.hash(jsonValue);

        return Buffer.from(JSON.stringify({
            value: jsonValue,
            signature: signature
        })).toString('base64');
    }

    /**
     * Verify the given signed payload.
     */
    public verify(payload: string): any {
        try {
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

            if (!decoded.value || !decoded.signature) {
                throw new DecryptionException('Invalid signed payload.');
            }

            // Verify with all available keys
            for (const key of this.keys) {
                const signature = createHmac('sha256', key)
                    .update(decoded.value)
                    .digest('hex');

                if (timingSafeEqual(Buffer.from(signature), Buffer.from(decoded.signature))) {
                    return JSON.parse(decoded.value);
                }
            }
        } catch (e) {
            // Fall through 
        }

        throw new DecryptionException('Signature verification failed.');
    }

    /**
     * Create a hash (HMAC) of the given value.
     */
    protected hash(value: string): string {
        return createHmac('sha256', this.keys[0])
            .update(value)
            .digest('hex');
    }

    /**
     * Get the JSON payload from the given string.
     */
    protected getJsonPayload(payload: string): any {
        try {
            const decoded = Buffer.from(payload, 'base64').toString('utf8');
            const data = JSON.parse(decoded);

            if (!this.validPayload(data)) {
                throw new DecryptionException();
            }

            return data;
        } catch (error) {
            throw new DecryptionException();
        }
    }

    /**
     * Verify that the encryption payload is valid.
     */
    protected validPayload(payload: any): boolean {
        return typeof payload === 'object' &&
            payload !== null &&
            payload.iv &&
            payload.value &&
            payload.tag;
    }
}
