
import fs from 'fs';
import path from 'path';
import { DatabaseManager } from '../DatabaseManager';

/**
 * SeedRunner class for executing database seeders
 */
export class SeedRunner {
    constructor(
        private db: DatabaseManager,
        private seedersPath: string
    ) { }

    /**
     * Run a specific seeder or all seeders if none specified
     */
    public async run(seederName?: string): Promise<void> {
        if (seederName) {
            await this.runSeeder(seederName);
        } else {
            // Default to DatabaseSeeder if it exists
            const files = this.getSeederFiles();
            if (files.includes('DatabaseSeeder.ts') || files.includes('DatabaseSeeder.js')) {
                await this.runSeeder('DatabaseSeeder');
            } else {
                console.log('\x1b[33mNo DatabaseSeeder found. Please specify a seeder name.\x1b[0m');
            }
        }
    }

    /**
     * Run a specific seeder
     */
    private async runSeeder(name: string): Promise<void> {
        // Remove extension if provided
        const cleanName = name.replace(/\.(ts|js)$/, '');
        const files = this.getSeederFiles();

        const file = files.find(f => f.startsWith(cleanName));
        if (!file) {
            throw new Error(`Seeder "${name}" not found in ${this.seedersPath}`);
        }

        console.log(`\x1b[33mSeeding: ${cleanName}\x1b[0m`);

        const fullPath = path.resolve(this.seedersPath, file);
        const module = require(fullPath);

        let SeederClass = module.default || module;
        if (typeof SeederClass !== 'function' && typeof SeederClass === 'object') {
            SeederClass = Object.values(SeederClass).find(v => typeof v === 'function');
        }

        if (typeof SeederClass !== 'function') {
            throw new Error(`Seeder ${file} does not export a valid Seeder class.`);
        }

        const seeder = new SeederClass();
        await seeder.run(this.db);

        console.log(`\x1b[32mSeeded:  ${cleanName}\x1b[0m`);
    }

    /**
     * Get all seeder files in the directory
     */
    private getSeederFiles(): string[] {
        if (!fs.existsSync(this.seedersPath)) return [];
        return fs.readdirSync(this.seedersPath)
            .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'))
            .sort();
    }
}
