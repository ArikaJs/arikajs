
import { Command } from '@arikajs/console';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

/**
 * Base class for database-related commands
 */
export abstract class DatabaseCommand extends Command {
    /**
     * Get a DatabaseManager instance configured with application settings
     */
    protected async getDatabaseManager(): Promise<any> {
        // Load .env from project root
        dotenv.config();

        const root = process.cwd();

        const { DatabaseManager } = await import('@arikajs/database');

        // Try to find database config
        let configPath = path.join(root, 'config/database.ts');
        if (!fs.existsSync(configPath)) {
            configPath = path.join(root, 'config/database.js');
        }

        if (!fs.existsSync(configPath)) {
            throw new Error('Database configuration not found. Please ensure config/database.ts exists.');
        }

        // Use dynamic import for both .ts and .js files
        try {
            const { createJiti } = await import('jiti');
            
            // Try to read tsconfig for aliases
            let alias = {};
            const tsconfigPath = path.join(root, 'tsconfig.json');
            if (fs.existsSync(tsconfigPath)) {
                try {
                    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
                    if (tsconfig.compilerOptions?.paths) {
                        const paths = tsconfig.compilerOptions.paths;
                        Object.entries(paths).forEach(([key, value]: [string, any]) => {
                            const aliasKey = key.replace('/*', '');
                            const aliasValue = value[0].replace('/*', '');
                            (alias as any)[aliasKey] = path.join(root, aliasValue);
                        });
                    }
                } catch (e) {
                    // Ignore tsconfig parsing errors
                }
            }

            const jiti = createJiti(typeof __filename !== 'undefined' ? __filename : process.cwd(), {
                interopDefault: true,
                alias
            });
            const config = await jiti.import(configPath) as any;
            
            return new DatabaseManager(config.default || config);
        } catch (error: any) {
            let message = error.message;
            if (message.includes('Could not locate the bindings file')) {
                message = 'Native database bindings are missing. Please run "npm install better-sqlite3" to recompile them for your architecture.';
            }
            throw new Error(`Failed to load database configuration: ${message}`);
        }
    }
}
