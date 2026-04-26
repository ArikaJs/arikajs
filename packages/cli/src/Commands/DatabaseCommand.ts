
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
            // We use the file:// protocol to ensure absolute paths work correctly across all environments
            // Adding a timestamp query parameter busts the ESM cache to ensure fresh config values
            const fileUrl = `file://${configPath}?v=${Date.now()}`;
            const configModule = await import(fileUrl);
            const config = configModule.default || configModule;
            
            return new DatabaseManager(config);
        } catch (error: any) {
            let message = error.message;
            if (message.includes('Could not locate the bindings file')) {
                message = 'Native database bindings are missing. Please run "npm install better-sqlite3" to recompile them for your architecture.';
            }
            throw new Error(`Failed to load database configuration: ${message}`);
        }
    }
}
