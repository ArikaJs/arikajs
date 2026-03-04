import { Filesystem } from '../Contracts/Filesystem';
import { BlobServiceClient, ContainerClient, BlobSASPermissions } from '@azure/storage-blob';
import { Readable } from 'stream';
import * as mime from 'mime-types';

export class AzureDriver implements Filesystem {
    protected client: BlobServiceClient;
    protected container: ContainerClient;
    protected containerName: string;
    protected urlEndpoint?: string;

    constructor(config: {
        connectionString: string;
        container: string;
        url?: string;
    }) {
        this.client = BlobServiceClient.fromConnectionString(config.connectionString);
        this.containerName = config.container;
        this.container = this.client.getContainerClient(config.container);
        this.urlEndpoint = config.url;
    }

    async put(path: string, contents: string | Buffer): Promise<void> {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents as string);

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: mime.lookup(path) || 'application/octet-stream'
            }
        });
    }

    async putStream(path: string, stream: Readable): Promise<void> {
        const blockBlobClient = this.container.getBlockBlobClient(path);

        await blockBlobClient.uploadStream(stream, 4 * 1024 * 1024, 20, {
            blobHTTPHeaders: {
                blobContentType: mime.lookup(path) || 'application/octet-stream'
            }
        });
    }

    async get(path: string): Promise<Buffer> {
        try {
            const blockBlobClient = this.container.getBlockBlobClient(path);
            return await blockBlobClient.downloadToBuffer();
        } catch (error: any) {
            if (error.statusCode === 404) {
                throw new Error(`File not found: ${path}`);
            }
            throw error;
        }
    }

    readStream(path: string): Readable {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        const { PassThrough } = require('stream');
        const passThrough = new PassThrough();

        blockBlobClient.download().then((response) => {
            if (response.readableStreamBody) {
                (response.readableStreamBody as Readable).pipe(passThrough);
            }
        }).catch((err) => {
            passThrough.emit('error', err);
        });

        return passThrough;
    }

    async exists(path: string): Promise<boolean> {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        return await blockBlobClient.exists();
    }

    async delete(path: string): Promise<void> {
        try {
            const blockBlobClient = this.container.getBlockBlobClient(path);
            await blockBlobClient.delete();
        } catch (error: any) {
            if (error.statusCode !== 404) throw error;
        }
    }

    url(path: string): string {
        if (this.urlEndpoint) {
            return `${this.urlEndpoint}/${path}`;
        }
        const blockBlobClient = this.container.getBlockBlobClient(path);
        return blockBlobClient.url;
    }

    async temporaryUrl(path: string, expiresAt: Date): Promise<string> {
        try {
            const blockBlobClient = this.container.getBlockBlobClient(path);

            const permissions = new BlobSASPermissions();
            permissions.read = true;

            const sasUrl = await blockBlobClient.generateSasUrl({
                permissions,
                expiresOn: expiresAt
            });
            return sasUrl;
        } catch (e: any) {
            if (e.message?.includes('generateSasUrl') || e.message?.includes('StorageSharedKeyCredential')) {
                throw new Error("Temporary URL requires Shared Key Credential which must be parsed from Connection String. Alternatively configure SAS manually.");
            }
            throw e;
        }
    }

    async size(path: string): Promise<number> {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        const properties = await blockBlobClient.getProperties();
        return properties.contentLength || 0;
    }

    async lastModified(path: string): Promise<number> {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        const properties = await blockBlobClient.getProperties();
        return properties.lastModified?.getTime() || 0;
    }

    async mimeType(path: string): Promise<string> {
        const blockBlobClient = this.container.getBlockBlobClient(path);
        const properties = await blockBlobClient.getProperties();
        return properties.contentType || mime.lookup(path) || 'application/octet-stream';
    }
}
