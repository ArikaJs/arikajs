import * as crypto from 'node:crypto';

const SESSION_ID_LENGTH = 40; // 40 hex chars = 20 bytes of entropy

/**
 * Handles reading and writing the session ID cookie.
 */
export class CookieSessionId {
    constructor(
        private readonly cookieName: string,
        private readonly secret: string,
    ) { }

    /**
     * Generate a cryptographically random session ID.
     */
    public generate(): string {
        return crypto.randomBytes(20).toString('hex');
    }

    /**
     * Read the session ID from incoming cookie headers.
     * Returns null if not found or signature is invalid.
     */
    public read(cookieHeader: string): string | null {
        const cookies = this.parseCookies(cookieHeader);
        const raw = cookies[this.cookieName];
        if (!raw) return null;
        return this.verify(raw);
    }

    /**
     * Produce a Set-Cookie header value for the session ID.
     */
    public write(sessionId: string, options: {
        lifetime: number;  // seconds
        path: string;
        secure: boolean;
        httpOnly: boolean;
        sameSite: string;
    }): string {
        const signed = this.sign(sessionId);
        const parts = [
            `${this.cookieName}=${encodeURIComponent(signed)}`,
            `Path=${options.path}`,
            `Max-Age=${options.lifetime}`,
            `SameSite=${options.sameSite}`,
        ];
        if (options.httpOnly) parts.push('HttpOnly');
        if (options.secure) parts.push('Secure');
        return parts.join('; ');
    }

    /**
     * Produce a Set-Cookie header that clears the session cookie.
     */
    public clear(path: string = '/'): string {
        return `${this.cookieName}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax`;
    }

    private sign(value: string): string {
        const mac = crypto.createHmac('sha256', this.secret).update(value).digest('base64url');
        return `${value}.${mac}`;
    }

    private verify(signed: string): string | null {
        const dot = signed.lastIndexOf('.');
        if (dot === -1) return null;
        const value = signed.slice(0, dot);
        const mac = signed.slice(dot + 1);
        const expected = crypto.createHmac('sha256', this.secret).update(value).digest('base64url');
        try {
            if (!crypto.timingSafeEqual(Buffer.from(mac, 'utf8'), Buffer.from(expected, 'utf8'))) {
                return null;
            }
        } catch {
            return null;
        }
        return value;
    }

    private parseCookies(header: string): Record<string, string> {
        const result: Record<string, string> = {};
        if (!header) return result;
        for (const pair of header.split(';')) {
            const idx = pair.indexOf('=');
            if (idx === -1) continue;
            const key = pair.slice(0, idx).trim();
            const val = pair.slice(idx + 1).trim();
            try { result[key] = decodeURIComponent(val); } catch { result[key] = val; }
        }
        return result;
    }
}
