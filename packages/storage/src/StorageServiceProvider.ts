import { ServiceProvider } from '@arikajs/foundation';
import { StorageManager } from './StorageManager';
import { Storage as DefaultStorage } from './index';

export class StorageServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public register(): void {
        this.app.singleton('storage', () => {
            return DefaultStorage;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public boot(): void {
        const config = this.app.make('config');
        if (config && config.has('filesystems')) {
            const filesystemsConfig = config.get('filesystems');
            (DefaultStorage as any).config = filesystemsConfig;
            
            // Re-initialize disks map if needed so that it uses new config
            (DefaultStorage as any).disks = new Map();
        }
    }
}
