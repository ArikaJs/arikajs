
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export class EnvLoader {
    /**
     * Load environment variables from the given path.
     */
    public static load(basePath: string): void {
        const envPath = path.join(basePath, '.env');

        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath, override: true });
        }

        // Load .env.example if .env doesn't exist (optional, mostly for local dev)
        const examplePath = path.join(basePath, '.env.example');
        if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
            dotenv.config({ path: examplePath, override: true });
        }
    }

    /**
     * Get an environment variable with intelligent type casting.
     */
    public static get<T = any>(key: string, defaultValue?: T): T {
        const value = process.env[key];

        if (value === undefined) {
            return defaultValue as T;
        }

        switch (value.toLowerCase()) {
            case 'true':
            case '(true)':
                return true as any;
            case 'false':
            case '(false)':
                return false as any;
            case 'empty':
            case '(empty)':
                return '' as any;
            case 'null':
            case '(null)':
                return null as any;
        }

        return value as any;
    }
}
