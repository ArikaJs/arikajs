import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as mime from 'mime-types';
import { Filesystem } from '../Contracts/Filesystem';
import { FileNotFoundException } from '../Exceptions/FileNotFoundException';

export class LocalDriver implements Filesystem {
    private root: string;
    private urlPrefix: string;

    constructor(config: { root: string; url?: string }) {
        this.root = path.resolve(config.root);
        this.urlPrefix = config.url || '';
    }

    /**
     * Get the full path for a file.
     */
    private getFullPath(filePath: string): string {
        return path.join(this.root, filePath);
    }

    /**
     * Ensure directory exists.
     */
    private async ensureDirectory(filePath: string): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }

    /**
     * Write contents to a file.
     */
    public async put(filePath: string, contents: string | Buffer): Promise<void> {
        const fullPath = this.getFullPath(filePath);
        await this.ensureDirectory(fullPath);
        await fs.writeFile(fullPath, contents);
    }

    /**
     * Write a stream to a file.
     */
    public async putStream(filePath: string, stream: Readable): Promise<void> {
        const fullPath = this.getFullPath(filePath);
        await this.ensureDirectory(fullPath);
        const writeStream = createWriteStream(fullPath);
        await pipeline(stream, writeStream);
    }

    /**
     * Read file contents.
     */
    public async get(filePath: string): Promise<Buffer> {
        const fullPath = this.getFullPath(filePath);

        if (!(await this.exists(filePath))) {
            throw new FileNotFoundException(filePath);
        }

        return await fs.readFile(fullPath);
    }

    /**
     * Read file as a stream.
     */
    public readStream(filePath: string): Readable {
        const fullPath = this.getFullPath(filePath);
        return createReadStream(fullPath);
    }

    /**
     * Check if a file exists.
     */
    public async exists(filePath: string): Promise<boolean> {
        const fullPath = this.getFullPath(filePath);

        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete a file.
     */
    public async delete(filePath: string): Promise<void> {
        const fullPath = this.getFullPath(filePath);

        if (await this.exists(filePath)) {
            await fs.unlink(fullPath);
        }
    }

    /**
     * Get the URL for a file.
     */
    public url(filePath: string): string {
        if (!this.urlPrefix) {
            return filePath;
        }

        return `${this.urlPrefix}/${filePath}`.replace(/\/+/g, '/').replace(':/', '://');
    }

    /**
     * Get a temporary URL for a file.
     * Note: For local driver, this just returns the normal URL as local files don't support signing by default
     * without a custom server implementation.
     */
    public async temporaryUrl(filePath: string, expiresAt: Date): Promise<string> {
        return this.url(filePath);
    }

    /**
     * Get the file size in bytes.
     */
    public async size(filePath: string): Promise<number> {
        const stats = await fs.stat(this.getFullPath(filePath));
        return stats.size;
    }

    /**
     * Get the last modified time of the file.
     */
    public async lastModified(filePath: string): Promise<number> {
        const stats = await fs.stat(this.getFullPath(filePath));
        return stats.mtimeMs;
    }

    /**
     * Get the mime type of the file.
     */
    public async mimeType(filePath: string): Promise<string> {
        return mime.lookup(filePath) || 'application/octet-stream';
    }
}
