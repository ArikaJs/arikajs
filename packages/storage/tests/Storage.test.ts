import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageManager, FileNotFoundException } from '../src';

describe('Arika Storage', () => {
    const testRoot = path.join(process.cwd(), 'test-storage');
    let storage: StorageManager;

    beforeEach(async () => {
        // Create test storage directory
        await fs.mkdir(testRoot, { recursive: true });

        // Configure storage
        const config = {
            default: 'local',
            disks: {
                local: {
                    driver: 'local',
                    root: testRoot
                },
                public: {
                    driver: 'local',
                    root: path.join(testRoot, 'public'),
                    url: '/storage'
                }
            }
        };

        storage = new StorageManager(config);
    });

    afterEach(async () => {
        // Clean up test storage directory
        try {
            await fs.rm(testRoot, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    it('puts and gets file content', async () => {
        await storage.put('test.txt', 'Hello Arika');
        const content = await storage.get('test.txt');

        assert.strictEqual(content.toString(), 'Hello Arika');
    });

    it('checks if file exists', async () => {
        await storage.put('exists.txt', 'content');

        const exists = await storage.exists('exists.txt');
        assert.strictEqual(exists, true);

        const notExists = await storage.exists('not-exists.txt');
        assert.strictEqual(notExists, false);
    });

    it('deletes files', async () => {
        await storage.put('delete-me.txt', 'content');
        assert.strictEqual(await storage.exists('delete-me.txt'), true);

        await storage.delete('delete-me.txt');
        assert.strictEqual(await storage.exists('delete-me.txt'), false);
    });

    it('throws FileNotFoundException for missing files', async () => {
        await assert.rejects(
            async () => await storage.get('missing.txt'),
            FileNotFoundException
        );
    });

    it('works with different disks', async () => {
        await storage.disk('local').put('local.txt', 'local content');
        await storage.disk('public').put('public.txt', 'public content');

        const localContent = await storage.disk('local').get('local.txt');
        const publicContent = await storage.disk('public').get('public.txt');

        assert.strictEqual(localContent.toString(), 'local content');
        assert.strictEqual(publicContent.toString(), 'public content');
    });

    it('generates URLs for files', async () => {
        await storage.disk('public').put('image.png', 'fake image');

        const url = storage.disk('public').url('image.png');
        assert.strictEqual(url, '/storage/image.png');
    });

    it('handles nested directories', async () => {
        await storage.put('nested/deep/file.txt', 'nested content');

        const exists = await storage.exists('nested/deep/file.txt');
        assert.strictEqual(exists, true);

        const content = await storage.get('nested/deep/file.txt');
        assert.strictEqual(content.toString(), 'nested content');
    });

    it('handles Buffer content', async () => {
        const buffer = Buffer.from('binary content');
        await storage.put('binary.dat', buffer);

        const retrieved = await storage.get('binary.dat');
        assert.deepStrictEqual(retrieved, buffer);
    });
});
