
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Application } from './Contracts/Application';

/**
 * Represents an uploaded file.
 */
export class UploadedFile {
    constructor(
        protected app: Application,
        protected metadata: {
            name: string;
            filename: string;
            tmpPath: string;
            encoding: string;
            mimeType: string;
        }
    ) {}

    /**
     * Get the original name of the file.
     */
    public getClientOriginalName(): string {
        return this.metadata.filename;
    }

    /**
     * Get the mime type of the file.
     */
    public getClientMimeType(): string {
        return this.metadata.mimeType;
    }

    /**
     * Get the temporary path of the file.
     */
    public getPath(): string {
        return this.metadata.tmpPath;
    }

    /**
     * Get the extension of the file.
     */
    public getExtension(): string {
        return path.extname(this.metadata.filename).slice(1);
    }

    /**
     * Store the uploaded file on a disk.
     */
    public async store(targetPath: string = '', options: string | { disk?: string; name?: string } = {}): Promise<string> {
        const config = typeof options === 'string' ? { disk: options } : options;
        const disk = config.disk || 'local';
        const name = config.name || this.generateRandomName();
        const fullPath = targetPath ? `${targetPath}/${name}` : name;

        const storage = this.app.make('storage');
        const contents = fs.readFileSync(this.metadata.tmpPath);

        await storage.disk(disk).put(fullPath, contents);

        return fullPath;
    }

    /**
     * Move the file to a permanent location.
     */
    public async move(directory: string, name?: string): Promise<string> {
        const targetName = name || this.generateRandomName();
        const targetPath = path.join(directory, targetName);

        if (!fs.existsSync(directory)) {
             fs.mkdirSync(directory, { recursive: true });
        }

        fs.renameSync(this.metadata.tmpPath, targetPath);
        this.metadata.tmpPath = targetPath;

        return targetPath;
    }

    /**
     * Generate a random filename.
     */
    private generateRandomName(): string {
        const random = Math.random().toString(36).substring(2, 15);
        const ext = this.getExtension();
        return `${random}${ext ? '.' + ext : ''}`;
    }
}
