import { Filesystem } from '../Contracts/Filesystem';
import { Storage as GCSStorage, Bucket, File } from '@google-cloud/storage';
import { Readable } from 'stream';
import * as mime from 'mime-types';

export class GCSDriver implements Filesystem {
    protected client: GCSStorage;
    protected bucket: Bucket;
    protected bucketName: string;
    protected urlEndpoint?: string;

    constructor(config: {
        projectId?: string;
        keyFilename?: string;
        bucket: string;
        url?: string;
        credentials?: any;
    }) {
        const gcsConfig: any = {};
        if (config.projectId) gcsConfig.projectId = config.projectId;
        if (config.keyFilename) gcsConfig.keyFilename = config.keyFilename;
        if (config.credentials) gcsConfig.credentials = config.credentials;

        this.client = new GCSStorage(gcsConfig);
        this.bucketName = config.bucket;
        this.bucket = this.client.bucket(config.bucket);
        this.urlEndpoint = config.url;
    }

    private getFile(path: string): File {
        return this.bucket.file(path);
    }

    async put(path: string, contents: string | Buffer): Promise<void> {
        const file = this.getFile(path);
        await file.save(contents, {
            contentType: mime.lookup(path) || 'application/octet-stream',
            resumable: false
        });
    }

    async putStream(path: string, stream: Readable): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = this.getFile(path);
            const writeStream = file.createWriteStream({
                contentType: mime.lookup(path) || 'application/octet-stream',
                resumable: false
            });

            stream.pipe(writeStream)
                .on('error', reject)
                .on('finish', resolve);
        });
    }

    async get(path: string): Promise<Buffer> {
        try {
            const [content] = await this.getFile(path).download();
            return content;
        } catch (error: any) {
            if (error.code === 404) {
                throw new Error(`File not found: ${path}`);
            }
            throw error;
        }
    }

    readStream(path: string): Readable {
        return this.getFile(path).createReadStream();
    }

    async exists(path: string): Promise<boolean> {
        const [exists] = await this.getFile(path).exists();
        return exists;
    }

    async delete(path: string): Promise<void> {
        try {
            await this.getFile(path).delete();
        } catch (error: any) {
            // Ignore if file doesn't exist
            if (error.code !== 404) throw error;
        }
    }

    url(path: string): string {
        if (this.urlEndpoint) {
            return `${this.urlEndpoint}/${path}`;
        }
        return `https://storage.googleapis.com/${this.bucketName}/${path}`;
    }

    async temporaryUrl(path: string, expiresAt: Date): Promise<string> {
        const [url] = await this.getFile(path).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: expiresAt.getTime(),
        });
        return url;
    }

    async size(path: string): Promise<number> {
        const [metadata] = await this.getFile(path).getMetadata();
        return parseInt((metadata.size as string) || '0', 10);
    }

    async lastModified(path: string): Promise<number> {
        const [metadata] = await this.getFile(path).getMetadata();
        return metadata.updated ? new Date(metadata.updated as string).getTime() : 0;
    }

    async mimeType(path: string): Promise<string> {
        const [metadata] = await this.getFile(path).getMetadata();
        return metadata.contentType || mime.lookup(path) || 'application/octet-stream';
    }

    async copy(path: string, newPath: string): Promise<void> {
        await this.getFile(path).copy(this.getFile(newPath));
    }

    async move(path: string, newPath: string): Promise<void> {
        await this.getFile(path).move(this.getFile(newPath));
    }
}
