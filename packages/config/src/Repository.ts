
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const localRequire = createRequire(import.meta.url);

// ─── Schema Types ───────────────────────────────────────────────────────────

export type SchemaRule = {
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    enum?: any[];
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
    children?: Record<string, SchemaRule>;
};

export type ConfigSchema = Record<string, SchemaRule | Record<string, SchemaRule>>;

export interface ValidationError {
    key: string;
    message: string;
}

// ─── Change Listener Types ──────────────────────────────────────────────────

export type ConfigChangeListener = (key: string, newValue: any, oldValue: any) => void;

// ─── Repository ─────────────────────────────────────────────────────────────

export class Repository {
    private config: Record<string, any> = {};
    private booted = false;

    // Feature 1: Config Caching
    private flatCache: Map<string, any> = new Map();
    private cacheBuilt = false;

    // Feature 2: Schema Validation
    private schema: ConfigSchema | null = null;

    // Feature 4: Change Listeners
    private listeners: Map<string, ConfigChangeListener[]> = new Map();
    private globalListeners: ConfigChangeListener[] = [];

    // Feature 6: Encrypted Config
    private decrypter: ((value: string) => string) | null = null;

    constructor(initialConfig: Record<string, any> = {}) {
        this.config = { ...initialConfig };
    }

    // ─── Loading ────────────────────────────────────────────────────────────

    /**
     * Load configuration files from the config directory.
     */
    public loadConfigDirectory(configPath: string, environment?: string): void {
        if (this.booted) {
            throw new Error('Configuration cannot be modified after boot.');
        }

        if (!fs.existsSync(configPath)) {
            return;
        }

        const files = fs.readdirSync(configPath);

        // Feature 3: Environment-based Merging
        // First load base configs (e.g., database.js)
        // Then overlay env-specific (e.g., database.production.js)
        const env = environment || process.env.NODE_ENV || 'development';

        const baseFiles = files.filter(
            (file: string) =>
                this.isConfigFile(file) && !this.isEnvSpecificFile(file),
        );

        const envFiles = files.filter(
            (file: string) =>
                this.isConfigFile(file) && file.includes(`.${env}.`),
        );

        // Load base configs first
        for (const file of baseFiles) {
            this.loadFile(configPath, file);
        }

        // Then overlay environment-specific configs
        for (const file of envFiles) {
            this.loadFile(configPath, file, true);
        }
    }

    private isConfigFile(file: string): boolean {
        return (
            file.endsWith('.js') ||
            file.endsWith('.ts') ||
            file.endsWith('.cjs') ||
            file.endsWith('.mjs')
        );
    }

    private isEnvSpecificFile(file: string): boolean {
        const envPatterns = [
            '.development.',
            '.production.',
            '.staging.',
            '.testing.',
            '.local.',
        ];
        return envPatterns.some((p) => file.includes(p));
    }

    private loadFile(
        configPath: string,
        file: string,
        isOverlay: boolean = false,
    ): void {
        const filePath = path.join(configPath, file);

        // Extract base config name (e.g., "database" from "database.production.js")
        const parts = path.basename(file, path.extname(file)).split('.');
        const configName = parts[0];

        try {
            let configValue;
            try {
                const module = localRequire(filePath);
                configValue = module.default || module;
            } catch {
                // ESM fallback — silently skip
            }

            if (typeof configValue === 'object' && configValue !== null) {
                if (isOverlay && this.config[configName]) {
                    // Deep merge for env overlays
                    this.config[configName] = this.deepMerge(
                        this.config[configName],
                        configValue,
                    );
                } else {
                    this.config[configName] = {
                        ...this.config[configName],
                        ...configValue,
                    };
                }
            }
        } catch {
            // Silently skip files that can't be loaded
        }
    }

    // ─── Get / Set / Has ────────────────────────────────────────────────────

    /**
     * Get a configuration value using dot notation.
     * Uses flat cache for O(1) lookup when booted.
     */
    public get<T = any>(key: string, defaultValue?: T): T {
        // Feature 1: Use flat cache after boot for O(1)
        if (this.cacheBuilt) {
            const cached = this.flatCache.get(key);
            if (cached !== undefined) {
                // Feature 6: Auto-decrypt encrypted values
                if (typeof cached === 'string' && cached.startsWith('enc:')) {
                    return this.decrypt(cached) as T;
                }
                return cached as T;
            }
            return defaultValue as T;
        }

        // Pre-boot: walk the tree
        const keys = key.split('.');
        let value: any = this.config;

        for (const k of keys) {
            if (value === undefined || value === null) {
                return defaultValue as T;
            }
            value = value[k];
        }

        const result = value !== undefined ? value : defaultValue;

        // Feature 6: Auto-decrypt encrypted values
        if (typeof result === 'string' && result.startsWith('enc:')) {
            return this.decrypt(result) as T;
        }

        return result as T;
    }

    /**
     * Check if a configuration key exists.
     */
    public has(key: string): boolean {
        if (this.cacheBuilt) {
            return this.flatCache.has(key);
        }
        return this.get(key) !== undefined;
    }

    /**
     * Set a configuration value using dot notation.
     */
    public set(key: string, value: any): void {
        if (this.booted) {
            throw new Error('Configuration cannot be modified after boot.');
        }

        const oldValue = this.get(key);

        const keys = key.split('.');
        let current = this.config;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (
                !(k in current) ||
                typeof current[k] !== 'object' ||
                current[k] === null
            ) {
                current[k] = {};
            }
            current = current[k];
        }

        current[keys[keys.length - 1]] = value;

        // Feature 4: Notify change listeners
        this.notifyListeners(key, value, oldValue);
    }

    /**
     * Get all configuration.
     */
    public all(): Record<string, any> {
        return { ...this.config };
    }

    // ─── Boot Lifecycle ─────────────────────────────────────────────────────

    /**
     * Mark the repository as booted (read-only).
     * Builds the flat cache and deep-freezes the config for immutability.
     */
    public markAsBooted(): void {
        // Feature 2: Validate schema before boot
        if (this.schema) {
            const errors = this.validateSchema();
            if (errors.length > 0) {
                const messages = errors.map((e) => `  - ${e.key}: ${e.message}`).join('\n');
                throw new Error(
                    `Configuration validation failed:\n${messages}`,
                );
            }
        }

        // Feature 1: Build flat cache
        this.buildFlatCache();

        // Feature 5: Deep freeze
        this.deepFreeze(this.config);

        this.booted = true;
    }

    /**
     * Check if the repository has been booted.
     */
    public isBooted(): boolean {
        return this.booted;
    }

    // ─── Feature 1: Config Caching ──────────────────────────────────────────

    /**
     * Build a flat Map of all dot-notation keys for O(1) lookups.
     */
    private buildFlatCache(obj?: Record<string, any>, prefix?: string): void {
        const target = obj || this.config;
        const pre = prefix ? `${prefix}.` : '';

        for (const key of Object.keys(target)) {
            const fullKey = `${pre}${key}`;
            const value = target[key];

            this.flatCache.set(fullKey, value);

            if (
                typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            ) {
                this.buildFlatCache(value, fullKey);
            }
        }

        if (!prefix) {
            this.cacheBuilt = true;
        }
    }

    // ─── Feature 2: Schema Validation ───────────────────────────────────────

    /**
     * Define a validation schema for the configuration.
     */
    public defineSchema(schema: ConfigSchema): this {
        this.schema = schema;
        return this;
    }

    /**
     * Validate the current config against the defined schema.
     */
    public validate(): ValidationError[] {
        if (!this.schema) return [];
        return this.validateSchema();
    }

    private validateSchema(
        schema?: Record<string, SchemaRule>,
        prefix?: string,
    ): ValidationError[] {
        const errors: ValidationError[] = [];
        const rules = schema || this.schema;

        if (!rules) return errors;

        for (const [key, rule] of Object.entries(rules)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const value = this.get(fullKey);

            // Handle nested schema via 'children'
            if ((rule as SchemaRule).children) {
                errors.push(
                    ...this.validateSchema(
                        (rule as SchemaRule).children,
                        fullKey,
                    ),
                );
                continue;
            }

            const r = rule as SchemaRule;

            // Required check
            if (r.required && (value === undefined || value === null)) {
                errors.push({
                    key: fullKey,
                    message:
                        r.message || `'${fullKey}' is required but not set.`,
                });
                continue;
            }

            // Skip further checks if value is undefined and not required
            if (value === undefined || value === null) continue;

            // Type check
            if (r.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== r.type) {
                    errors.push({
                        key: fullKey,
                        message:
                            r.message ||
                            `'${fullKey}' must be of type '${r.type}', got '${actualType}'.`,
                    });
                }
            }

            // Enum check
            if (r.enum && !r.enum.includes(value)) {
                errors.push({
                    key: fullKey,
                    message:
                        r.message ||
                        `'${fullKey}' must be one of [${r.enum.join(', ')}], got '${value}'.`,
                });
            }

            // Min/Max for numbers
            if (r.type === 'number' && typeof value === 'number') {
                if (r.min !== undefined && value < r.min) {
                    errors.push({
                        key: fullKey,
                        message:
                            r.message ||
                            `'${fullKey}' must be >= ${r.min}, got ${value}.`,
                    });
                }
                if (r.max !== undefined && value > r.max) {
                    errors.push({
                        key: fullKey,
                        message:
                            r.message ||
                            `'${fullKey}' must be <= ${r.max}, got ${value}.`,
                    });
                }
            }

            // Min/Max for string length
            if (r.type === 'string' && typeof value === 'string') {
                if (r.min !== undefined && value.length < r.min) {
                    errors.push({
                        key: fullKey,
                        message:
                            r.message ||
                            `'${fullKey}' must have at least ${r.min} characters.`,
                    });
                }
                if (r.max !== undefined && value.length > r.max) {
                    errors.push({
                        key: fullKey,
                        message:
                            r.message ||
                            `'${fullKey}' must have at most ${r.max} characters.`,
                    });
                }
            }

            // Pattern check
            if (r.pattern && typeof value === 'string' && !r.pattern.test(value)) {
                errors.push({
                    key: fullKey,
                    message:
                        r.message ||
                        `'${fullKey}' does not match the required pattern.`,
                });
            }
        }

        return errors;
    }

    // ─── Feature 3: Environment Merging (handled in loadConfigDirectory) ────

    // ─── Feature 4: Config Change Listeners ─────────────────────────────────

    /**
     * Register a listener for changes to a specific config key.
     */
    public onChange(key: string, listener: ConfigChangeListener): this {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key)!.push(listener);
        return this;
    }

    /**
     * Register a global listener for ALL config changes.
     */
    public onAnyChange(listener: ConfigChangeListener): this {
        this.globalListeners.push(listener);
        return this;
    }

    private notifyListeners(key: string, newValue: any, oldValue: any): void {
        // Key-specific listeners
        const keyListeners = this.listeners.get(key);
        if (keyListeners) {
            for (const listener of keyListeners) {
                listener(key, newValue, oldValue);
            }
        }

        // Wildcard: notify listeners for parent keys too
        // e.g. changing 'database.host' should notify 'database' listeners
        const parts = key.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentKey = parts.slice(0, i).join('.');
            const parentListeners = this.listeners.get(parentKey);
            if (parentListeners) {
                for (const listener of parentListeners) {
                    listener(key, newValue, oldValue);
                }
            }
        }

        // Global listeners
        for (const listener of this.globalListeners) {
            listener(key, newValue, oldValue);
        }
    }

    // ─── Feature 5: Deep Freeze ─────────────────────────────────────────────

    /**
     * Recursively freeze an object to prevent any mutations.
     */
    private deepFreeze(obj: any): any {
        if (obj === null || typeof obj !== 'object') return obj;

        Object.freeze(obj);

        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
                this.deepFreeze(value);
            }
        }

        return obj;
    }

    // ─── Feature 6: Encrypted Config Values ─────────────────────────────────

    /**
     * Set a decrypter function for auto-decrypting `enc:` prefixed values.
     */
    public setDecrypter(fn: (encryptedValue: string) => string): this {
        this.decrypter = fn;
        return this;
    }

    private decrypt(value: string): string {
        const encrypted = value.substring(4); // Remove 'enc:' prefix
        if (this.decrypter) {
            return this.decrypter(encrypted);
        }
        // If no decrypter is set, return the raw encrypted string
        return encrypted;
    }

    // ─── Utilities ──────────────────────────────────────────────────────────

    /**
     * Deep merge two objects. Source values override target values.
     */
    private deepMerge(
        target: Record<string, any>,
        source: Record<string, any>,
    ): Record<string, any> {
        const result = { ...target };

        for (const key of Object.keys(source)) {
            if (
                source[key] &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key]) &&
                result[key] &&
                typeof result[key] === 'object' &&
                !Array.isArray(result[key])
            ) {
                result[key] = this.deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }
}
