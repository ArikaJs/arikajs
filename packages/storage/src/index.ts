export * from './StorageManager';
export * from './Disk';
export * from './Contracts/Filesystem';
export * from './Drivers/LocalDriver';
export * from './Drivers/S3Driver';
export * from './Exceptions/FileNotFoundException';

// Export a default Storage instance (will be configured by the application)
import { StorageManager } from './StorageManager';

// Default configuration for standalone usage
const defaultConfig = {
    default: 'local',
    disks: {
        local: {
            driver: 'local',
            root: './storage/app'
        }
    }
};

export const Storage = new StorageManager(defaultConfig);
