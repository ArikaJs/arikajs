import { SessionDriver } from './Contracts/SessionDriver';

/**
 * Per-request session instance.
 *
 * Features:
 * - Lazy loading: session data is loaded from the driver only on first access
 * - Write optimization: data is only persisted when it has been modified (dirty)
 * - Flash data: one-request messages automatically cleared after the next request
 * - Session regeneration: generate a new ID to prevent session fixation
 */
export class Session {
    private _data: Record<string, any> | null = null; // null = not yet loaded
    private _dirty = false;
    private _destroyed = false;
    private _newId: string | null = null; // set when regenerated

    constructor(
        private readonly driver: SessionDriver,
        private _sessionId: string,
        private readonly ttlSeconds: number,
    ) { }

    // ──────────────────────────────────────────────────────────────────────────
    //  Lazy loading
    // ──────────────────────────────────────────────────────────────────────────

    private async ensureLoaded(): Promise<void> {
        if (this._data === null) {
            const loaded = await this.driver.load(this._sessionId);
            this._data = loaded ?? {};
            // Age out flash data from the previous request
            this.ageFlashData();
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Public API
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Get the current session ID.
     */
    public getId(): string {
        return this._newId ?? this._sessionId;
    }

    /**
     * Check if the session has been modified.
     */
    public isDirty(): boolean {
        return this._dirty;
    }

    /**
     * Check if the session has been destroyed.
     */
    public isDestroyed(): boolean {
        return this._destroyed;
    }

    /**
     * Set a value in the session.
     */
    public async set(key: string, value: any): Promise<void> {
        await this.ensureLoaded();
        this._data![key] = value;
        this._dirty = true;
    }

    /**
     * Alias for set() — compatible with the old put() convention.
     */
    public async put(key: string, value: any): Promise<void> {
        return this.set(key, value);
    }

    /**
     * Get a value from the session. Returns defaultValue if not found.
     */
    public async get(key: string, defaultValue: any = null): Promise<any> {
        await this.ensureLoaded();
        return key in this._data! ? this._data![key] : defaultValue;
    }

    /**
     * Check whether a key exists in the session.
     */
    public async has(key: string): Promise<boolean> {
        await this.ensureLoaded();
        return key in this._data!;
    }

    /**
     * Remove a key from the session.
     */
    public async forget(key: string): Promise<void> {
        await this.ensureLoaded();
        if (key in this._data!) {
            delete this._data![key];
            this._dirty = true;
        }
    }

    /**
     * Return all session data.
     */
    public async all(): Promise<Record<string, any>> {
        await this.ensureLoaded();
        return { ...this._data! };
    }

    /**
     * Store flash data — only available during the next request.
     */
    public async flash(key: string, value: any): Promise<void> {
        await this.ensureLoaded();
        this._data![key] = value;
        // Track which keys are flash so we can purge them
        const flashKeys: string[] = this._data!['__flash__'] ?? [];
        if (!flashKeys.includes(key)) flashKeys.push(key);
        this._data!['__flash__'] = flashKeys;
        this._dirty = true;
    }

    /**
     * Keep flash keys alive for one more request.
     */
    public async reflash(...keys: string[]): Promise<void> {
        await this.ensureLoaded();
        const flashKeys: string[] = this._data!['__flash__'] ?? [];
        const keepKeys: string[] = this._data!['__flash_keep__'] ?? [];
        const targets = keys.length > 0 ? keys : flashKeys;
        for (const k of targets) {
            if (!keepKeys.includes(k)) keepKeys.push(k);
        }
        this._data!['__flash_keep__'] = keepKeys;
        this._dirty = true;
    }

    /**
     * Completely destroy this session (removes from storage).
     */
    public async destroy(): Promise<void> {
        await this.driver.destroy(this._sessionId);
        this._data = {};
        this._dirty = false;
        this._destroyed = true;
    }

    /**
     * Regenerate the session ID (prevents session fixation).
     * The old session is destroyed and a new ID is created.
     */
    public async regenerate(): Promise<string> {
        await this.ensureLoaded();
        await this.driver.destroy(this._sessionId);
        const crypto = await import('node:crypto');
        this._newId = crypto.randomBytes(20).toString('hex');
        this._dirty = true;
        return this._newId;
    }

    /**
     * Get the CSRF token from the session.
     */
    public async token(): Promise<string> {
        await this.ensureLoaded();
        if (!this._data!['_token']) {
            await this.regenerateToken();
        }
        return this._data!['_token'];
    }

    /**
     * Regenerate the CSRF token.
     */
    public async regenerateToken(): Promise<void> {
        await this.ensureLoaded();
        const crypto = await import('node:crypto');
        this._data!['_token'] = crypto.randomBytes(40).toString('hex');
        this._dirty = true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Lifecycle (called by StartSession middleware)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Persist session data back to the driver.
     * Only writes if data has changed (write optimization).
     */
    public async save(): Promise<void> {
        if (this._destroyed) return;
        if (this._data === null) return; // never accessed, skip write

        // Promote next-request flash keys
        this.prepareFlashForNextRequest();

        if (this._dirty) {
            const id = this._newId ?? this._sessionId;
            await this.driver.save(id, this._data!, this.ttlSeconds);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Flash internals
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * On load: remove flash keys from the PREVIOUS request (unless kept).
     */
    private ageFlashData(): void {
        const flashKeys: string[] = this._data!['__flash__'] ?? [];
        const keepKeys: string[] = this._data!['__flash_keep__'] ?? [];

        for (const key of flashKeys) {
            if (!keepKeys.includes(key)) {
                delete this._data![key];
            }
        }

        // Reset tracking
        this._data!['__flash__'] = [];
        this._data!['__flash_keep__'] = [];
    }

    /**
     * On save: move __flash_new__ → __flash__ for the next request.
     */
    private prepareFlashForNextRequest(): void {
        if (!this._data) return;
        const newFlash: string[] = this._data['__flash_new__'] ?? [];
        const existing: string[] = this._data['__flash__'] ?? [];
        this._data['__flash__'] = [...new Set([...existing, ...newFlash])];
        delete this._data['__flash_new__'];
    }
}
