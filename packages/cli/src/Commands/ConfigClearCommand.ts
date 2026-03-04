import { Command } from '@arikajs/console';
import fs from 'fs';
import path from 'path';

export class ConfigClearCommand extends Command {
    public signature = 'config:clear';
    public description = 'Remove the configuration cache file';

    public async handle() {
        const cwd = process.cwd();
        const cacheFile = path.join(cwd, 'bootstrap', 'cache', 'config.json');

        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
            this.success('Configuration cache cleared successfully!');
        } else {
            this.info('No configuration cache file found.');
        }
    }
}
