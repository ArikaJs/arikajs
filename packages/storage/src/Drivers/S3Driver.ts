import { Filesystem } from '../Contracts/Filesystem';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    S3ClientConfig
} from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from 'stream';
import * as mime from 'mime-types';

export class S3Driver implements Filesystem {
    protected client: S3Client;
    protected bucket: string;
    protected region: string;
    protected urlEndpoint?: string;

    constructor(config: {
        key: string;
        secret: string;
        region: string;
        bucket: string;
        endpoint?: string;
        url?: string;
        forcePathStyle?: boolean;
    }) {
        const s3Config: S3ClientConfig = {
            region: config.region,
            credentials: {
                accessKeyId: config.key,
                secretAccessKey: config.secret,
            },
            endpoint: config.endpoint,
            forcePathStyle: config.forcePathStyle,
        };

        this.client = new S3Client(s3Config);
        this.bucket = config.bucket;
        this.region = config.region;
        this.urlEndpoint = config.url;
    }

    /**
     * Write contents to a file.
     */
    async put(path: string, contents: string | Buffer): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: contents,
            ContentType: mime.lookup(path) || 'application/octet-stream'
        });

        await this.client.send(command);
    }

    /**
     * Write a stream to a file.
     */
    async putStream(path: string, stream: Readable): Promise<void> {
        // Note: For large streams, you might want to use Upload from @aws-sdk/lib-storage
        // but for basic implementation, this works.
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: stream,
            ContentType: mime.lookup(path) || 'application/octet-stream'
        });

        await this.client.send(command);
    }

    /**
     * Read file contents.
     */
    async get(path: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error(`File not found: ${path}`);
        }

        // Convert stream to buffer
        return this.streamToBuffer(response.Body as Readable);
    }

    /**
     * Read file as a stream.
     */
    readStream(path: string): Readable {
        // We use a custom stream that fetches from S3 on demand
        // Alternatively, we can use a pass-through stream but it's more complex.
        // For simplicity, we return the S3 body which is a Readable.
        // However, this needs to be an async call in some contexts.
        // A better way is to provide a method that returns a Promise of a Readable.
        // But to match the interface sync signature:

        const { Readable } = require('stream');
        const passThrough = new Readable({
            read() { }
        });

        this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: path
        })).then(response => {
            if (response.Body) {
                (response.Body as Readable).pipe(passThrough);
            }
        }).catch(err => {
            passThrough.emit('error', err);
        });

        return passThrough;
    }

    /**
     * Check if a file exists.
     */
    async exists(path: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: path,
            });

            await this.client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Delete a file.
     */
    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        await this.client.send(command);
    }

    /**
     * Get the URL for a file.
     */
    url(path: string): string {
        if (this.urlEndpoint) {
            return `${this.urlEndpoint}/${path}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
    }

    /**
     * Get a temporary URL for a file.
     */
    async temporaryUrl(path: string, expiresAt: Date): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

        return await getSignedUrl(this.client, command, { expiresIn });
    }

    /**
     * Get the file size in bytes.
     */
    async size(path: string): Promise<number> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);
        return response.ContentLength || 0;
    }

    /**
     * Get the last modified time of the file.
     */
    async lastModified(path: string): Promise<number> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);
        return response.LastModified?.getTime() || 0;
    }

    /**
     * Get the mime type of the file.
     */
    async mimeType(path: string): Promise<string> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        const response = await this.client.send(command);
        return response.ContentType || mime.lookup(path) || 'application/octet-stream';
    }

    /**
     * Helper to convert stream to buffer.
     */
    private async streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
