import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class ConfigCacheCommand extends Command {
    public signature = 'config:cache';
    public description = 'Create a cache file for faster configuration loading';

    public async handle() {
        const cwd = process.cwd();

        try {
            // Import the application logic to build the config repository
            const appPath = path.join(cwd, 'bootstrap', 'app.ts');
            let configRepo;

            // In ArikaJS applications, we can theoretically just instantiate a new Repository,
            // load the config directory manually, and dump it to JSON.
            // This avoids having to boot the whole app container.
            const { Repository } = await import(path.join(cwd, 'node_modules', '@arikajs', 'config'));
            const configPath = path.join(cwd, 'config');

            if (!fs.existsSync(configPath)) {
                this.error('Config directory not found at: ' + configPath);
                return;
            }

            configRepo = new Repository();
            configRepo.loadConfigDirectory(configPath);

            // Build the JSON representation of the config
            const configAll = configRepo.all();

            // Generate the cache directory if it doesn't exist
            const cacheDir = path.join(cwd, 'bootstrap', 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            // Write the cached configuration
            const cacheFile = path.join(cacheDir, 'config.json');
            fs.writeFileSync(cacheFile, JSON.stringify(configAll, null, 2));

            this.success('Configuration cached successfully!');
        } catch (e: any) {
            this.error('Failed to cache configuration.');
            this.error(e.message);
            process.exitCode = 1;
        }
    }
}
