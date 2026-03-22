
import { Command } from '@arikajs/console';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Create a symbolic link from "storage/app/public" to "public/storage".
 */
export class StorageLinkCommand extends Command {
    /**
     * The signature of the console command.
     */
    public signature = 'storage:link';

    /**
     * The description of the console command.
     */
    public description = 'Create a symbolic link from "storage/app/public" to "public/storage"';

    /**
     * Execute the console command.
     */
    public async handle(): Promise<number> {
        const root = process.cwd();
        const publicPath = path.join(root, 'public', 'storage');
        const storagePath = path.join(root, 'storage', 'app', 'public');

        if (fs.existsSync(publicPath)) {
            this.error('The "public/storage" directory already exists.');
            return 1;
        }

        if (!fs.existsSync(storagePath)) {
            this.info('Creating source directory "storage/app/public"...');
            fs.mkdirSync(storagePath, { recursive: true });
        }

        try {
            // Determine link type if on Windows
            const isWindows = process.platform === 'win32';
            
            // Create symlink
            fs.symlinkSync(storagePath, publicPath, isWindows ? 'junction' : 'dir');
            
            this.info('The [public/storage] link has been connected to [storage/app/public].');
            return 0;
        } catch (error: any) {
            this.error(`Failed to create symbolic link: ${error.message}`);
            
            if (process.platform === 'win32') {
                this.comment('Try running the terminal as Administrator.');
            }
            
            return 1;
        }
    }
}
