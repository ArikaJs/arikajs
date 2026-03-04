
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

        // Use ts-node for .ts files
        if (configPath.endsWith('.ts')) {
            try {
                // Register ts-node if it exists in the project
                const tsNodePath = path.join(root, 'node_modules', 'ts-node');
                if (fs.existsSync(tsNodePath)) {
                    require(tsNodePath).register({ transpileOnly: true });
                } else {
                    // Fallback to global/environment ts-node register
                    require('ts-node/register');
                }
            } catch (e) {
                // Ignore if ts-node/register fails, maybe it's already handled by arika-cli runner
            }
        }

        try {
            // Clear cache for the config file to ensure we get fresh values
            delete require.cache[require.resolve(configPath)];
            const configModule = require(configPath);
            const config = configModule.default || configModule;
            return new DatabaseManager(config);
        } catch (error: any) {
            throw new Error(`Failed to load database configuration: ${error.message}`);
        }
    }
}
