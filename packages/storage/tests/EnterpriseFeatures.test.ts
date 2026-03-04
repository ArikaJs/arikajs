import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageManager, Filesystem } from '../src';
import { Readable } from 'stream';

class DummyMemoryDriver implements Filesystem {
    public files: Map<string, string | Buffer> = new Map();

    async put(path: string, contents: string | Buffer): Promise<void> {
        this.files.set(path, contents);
    }

    async putStream(path: string, stream: Readable): Promise<void> { }

    async get(path: string): Promise<Buffer> {
        if (!this.files.has(path)) throw new Error('Not found');
        const content = this.files.get(path)!;
        return Buffer.isBuffer(content) ? content : Buffer.from(content);
    }

    readStream(path: string): Readable { return new Readable(); }

    async exists(path: string): Promise<boolean> {
        return this.files.has(path);
    }

    async delete(path: string): Promise<void> {
        this.files.delete(path);
    }

    url(path: string): string { return `memory://${path}`; }

    async temporaryUrl(path: string, expiresAt: Date): Promise<string> { return ''; }

    async size(path: string): Promise<number> { return 0; }

    async lastModified(path: string): Promise<number> { return 0; }

    async mimeType(path: string): Promise<string> { return 'text/plain'; }
}

describe('Enterprise Storage Features', () => {
    const testRoot = path.join(process.cwd(), 'test-storage-enterprise');
    let storage: StorageManager;

    beforeEach(async () => {
        await fs.mkdir(testRoot, { recursive: true });

        const config = {
            default: 'local',
            disks: {
                local: {
                    driver: 'local',
                    root: testRoot
                },
                memory: {
                    driver: 'memory'
                }
            }
        };

        storage = new StorageManager(config);
    });

    afterEach(async () => {
        try {
            await fs.rm(testRoot, { recursive: true, force: true });
        } catch (error) { }
    });

    it('can extend storage manager with custom driver', async () => {
        const dummyDriver = new DummyMemoryDriver();

        storage.extend('memory', (config) => dummyDriver);

        await storage.disk('memory').put('test.txt', 'Memory Content');

        assert.strictEqual(dummyDriver.files.has('test.txt'), true);
        const retrieved = await storage.disk('memory').get('test.txt');
        assert.strictEqual(retrieved.toString(), 'Memory Content');
    });

    it('can use middleware to intercept pipeline operations', async () => {
        let loggedPath = '';

        const loggingMiddleware = async (data: any, next: (data: any) => Promise<any>) => {
            if (data.operation === 'put') {
                loggedPath = data.path;
                data.contents = data.contents + ' - Intercepted';
            }
            return await next(data);
        };

        storage.disk('local').middleware(loggingMiddleware);

        await storage.put('middleware.txt', 'Original');

        assert.strictEqual(loggedPath, 'middleware.txt');
        const contents = await storage.get('middleware.txt');
        assert.strictEqual(contents.toString(), 'Original - Intercepted');
    });

    it('can copy files with fallback', async () => {
        await storage.put('original.txt', 'Copy Me');
        await storage.copy('original.txt', 'copied.txt');

        assert.strictEqual(await storage.exists('copied.txt'), true);
        assert.strictEqual((await storage.get('copied.txt')).toString(), 'Copy Me');
    });

    it('can move files with fallback', async () => {
        await storage.put('source.txt', 'Move Me');
        await storage.move('source.txt', 'destination.txt');

        assert.strictEqual(await storage.exists('source.txt'), false);
        assert.strictEqual(await storage.exists('destination.txt'), true);
        assert.strictEqual((await storage.get('destination.txt')).toString(), 'Move Me');
    });

    it('can append to files', async () => {
        await storage.put('append.txt', 'Line 1');
        await storage.append('append.txt', 'Line 2');

        const contents = await storage.get('append.txt');
        assert.strictEqual(contents.toString(), 'Line 1\nLine 2');
    });

    it('can prepend to files', async () => {
        await storage.put('prepend.txt', 'Line 2');
        await storage.prepend('prepend.txt', 'Line 1');

        const contents = await storage.get('prepend.txt');
        assert.strictEqual(contents.toString(), 'Line 1\nLine 2');
    });
});
