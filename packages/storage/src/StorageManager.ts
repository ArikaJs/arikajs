import { Disk } from './Disk';
import { Filesystem } from './Contracts/Filesystem';
import { LocalDriver } from './Drivers/LocalDriver';
import { S3Driver } from './Drivers/S3Driver';
import { GCSDriver } from './Drivers/GCSDriver';
import { AzureDriver } from './Drivers/AzureDriver';

export class StorageManager {
    private disks: Map<string, Disk> = new Map();
    private customCreators: Map<string, (config: any) => Filesystem> = new Map();
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    /**
     * Register a custom driver creator.
     */
    public extend(driver: string, callback: (config: any) => Filesystem): this {
        this.customCreators.set(driver, callback);
        return this;
    }

    /**
     * Get a disk instance.
     */
    public disk(name?: string): Disk {
        name = name || this.config.default;

        if (!name) {
            throw new Error('No default disk configured.');
        }

        if (!this.disks.has(name)) {
            this.disks.set(name, this.resolveDisk(name));
        }

        return this.disks.get(name)!;
    }

    /**
     * Resolve a disk from configuration.
     */
    private resolveDisk(name: string): Disk {
        const diskConfig = this.config.disks[name];

        if (!diskConfig) {
            throw new Error(`Disk [${name}] is not configured.`);
        }

        const driver = this.createDriver(diskConfig);
        return new Disk(driver);
    }

    /**
     * Create a driver instance based on configuration.
     */
    private createDriver(config: any): Filesystem {
        if (this.customCreators.has(config.driver)) {
            return this.customCreators.get(config.driver)!(config);
        }

        switch (config.driver) {
            case 'local':
                return new LocalDriver(config);
            case 's3':
                return new S3Driver(config);
            case 'gcs':
                return new GCSDriver(config);
            case 'azure':
                return new AzureDriver(config);
            default:
                throw new Error(`Driver [${config.driver}] is not supported.`);
        }
    }

    /**
     * Proxy methods to the default disk.
     */
    public async put(path: string, contents: string | Buffer): Promise<void> {
        return await this.disk().put(path, contents);
    }

    public async putStream(path: string, stream: any): Promise<void> {
        return await this.disk().putStream(path, stream);
    }

    public async get(path: string): Promise<Buffer> {
        return await this.disk().get(path);
    }

    public readStream(path: string): any {
        return this.disk().readStream(path);
    }

    public async exists(path: string): Promise<boolean> {
        return await this.disk().exists(path);
    }

    public async delete(path: string): Promise<void> {
        return await this.disk().delete(path);
    }

    public url(path: string): string {
        return this.disk().url(path);
    }

    public async temporaryUrl(path: string, expiresAt: Date): Promise<string> {
        return await this.disk().temporaryUrl(path, expiresAt);
    }

    public async size(path: string): Promise<number> {
        return await this.disk().size(path);
    }

    public async lastModified(path: string): Promise<number> {
        return await this.disk().lastModified(path);
    }

    public async mimeType(path: string): Promise<string> {
        return await this.disk().mimeType(path);
    }

    public async copy(path: string, newPath: string): Promise<void> {
        return await this.disk().copy(path, newPath);
    }

    public async move(path: string, newPath: string): Promise<void> {
        return await this.disk().move(path, newPath);
    }

    public async append(path: string, contents: string | Buffer): Promise<void> {
        return await this.disk().append(path, contents);
    }

    public async prepend(path: string, contents: string | Buffer): Promise<void> {
        return await this.disk().prepend(path, contents);
    }
}
