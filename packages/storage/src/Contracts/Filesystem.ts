import { Readable, Writable } from 'stream';

export interface Filesystem {
    /**
     * Write contents to a file.
     */
    put(path: string, contents: string | Buffer): Promise<void>;

    /**
     * Write a stream to a file.
     */
    putStream(path: string, stream: Readable): Promise<void>;

    /**
     * Read file contents.
     */
    get(path: string): Promise<Buffer>;

    /**
     * Read file as a stream.
     */
    readStream(path: string): Readable;

    /**
     * Check if a file exists.
     */
    exists(path: string): Promise<boolean>;

    /**
     * Delete a file.
     */
    delete(path: string): Promise<void>;

    /**
     * Get the URL for a file.
     */
    url(path: string): string;

    /**
     * Get a temporary URL for a file.
     */
    temporaryUrl(path: string, expiresAt: Date): Promise<string>;

    /**
     * Get the file size in bytes.
     */
    size(path: string): Promise<number>;

    /**
     * Get the last modified time of the file.
     */
    lastModified(path: string): Promise<number>;

    /**
     * Get the mime type of the file.
     */
    mimeType(path: string): Promise<string>;

    /**
     * Copy a file to a new location.
     */
    copy?(path: string, newPath: string): Promise<void>;

    /**
     * Move a file to a new location.
     */
    move?(path: string, newPath: string): Promise<void>;

    /**
     * Append to a file.
     */
    append?(path: string, contents: string | Buffer): Promise<void>;

    /**
     * Prepend to a file.
     */
    prepend?(path: string, contents: string | Buffer): Promise<void>;
}
