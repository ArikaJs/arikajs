
import { ServiceProvider } from '@arikajs/foundation';
import { StorageManager, Storage } from '@arikajs/storage';

export class StorageServiceProvider extends ServiceProvider {
    /**
     * Register the service provider.
     */
    public async register(): Promise<void> {
        this.app.singleton('storage', () => {
            const config = this.app.config().get('filesystems', {
                default: 'local',
                disks: {
                    local: {
                        driver: 'local',
                        root: 'storage/app',
                    },
                    public: {
                        driver: 'local',
                        root: 'storage/app/public',
                        visibility: 'public',
                    }
                }
            });

            // Automatically bootstrap the globally imported Storage instance
            (Storage as any).config = config;
            (Storage as any).disks = new Map();

            return Storage;
        });

        this.app.alias('storage', StorageManager);
    }

    /**
     * Boot the service provider.
     */
    public async boot(): Promise<void> {
        //
    }
}
