import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { StorageManager } from '../src';

describe('Advanced Storage Features', () => {
    const testRoot = path.join(process.cwd(), 'test-storage-advanced');
    let storage: StorageManager;

    beforeEach(async () => {
        await fs.mkdir(testRoot, { recursive: true });
        const config = {
            default: 'local',
            disks: {
                local: {
                    driver: 'local',
                    root: testRoot,
                    url: 'http://localhost:3000/storage'
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

    it('handles streaming uploads and downloads', async () => {
        const fileName = 'stream.txt';
        const content = 'Streaming across Arika';
        const stream = Readable.from([content]);

        // Test putStream
        await storage.putStream(fileName, stream);

        // Test exists
        assert.strictEqual(await storage.exists(fileName), true);

        // Test readStream
        const readStream = storage.readStream(fileName);
        let retrieved = '';
        for await (const chunk of readStream) {
            retrieved += chunk;
        }
        assert.strictEqual(retrieved, content);
    });

    it('retrieves file metadata (size, lastModified, mimeType)', async () => {
        const fileName = 'test.json';
        const content = JSON.stringify({ arika: 'js' });
        await storage.put(fileName, content);

        // Size
        const size = await storage.size(fileName);
        assert.strictEqual(size, Buffer.from(content).length);

        // Last Modified
        const lastModified = await storage.lastModified(fileName);
        assert.ok(lastModified > 0);
        assert.ok(Date.now() - lastModified < 5000); // Created recently

        // Mime Type
        const mimeType = await storage.mimeType(fileName);
        assert.strictEqual(mimeType, 'application/json');
    });

    it('executes disk-level middleware', async () => {
        const fileName = 'middleware.txt';
        let middlewareCalled = false;

        // Register a simple middleware that appends text to the path
        storage.disk('local').middleware(async (data: any, next: any) => {
            middlewareCalled = true;
            if (data.operation === 'put') {
                data.contents = data.contents + ' (filtered by middleware)';
            }
            return await next(data);
        });

        await storage.disk('local').put(fileName, 'Hello');

        const content = await storage.disk('local').get(fileName);
        assert.strictEqual(middlewareCalled, true);
        assert.strictEqual(content.toString(), 'Hello (filtered by middleware)');
    });

    it('handles temporary URLs (Local Driver fallback)', async () => {
        const fileName = 'private.txt';
        await storage.put(fileName, 'secret');

        const expiresAt = new Date(Date.now() + 3600000);
        const url = await storage.temporaryUrl(fileName, expiresAt);

        // For local driver, it falls back to normal URL
        assert.strictEqual(url, 'http://localhost:3000/storage/private.txt');
    });
});
