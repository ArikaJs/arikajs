
import fs from 'fs';
import path from 'path';
import { Store } from '../Contracts/Store';

export class FileDriver implements Store {
    protected directory: string;

    constructor(directory: string, protected prefix: string = '') {
        this.directory = directory;
        this.ensureDirectoryExists();
    }

    public async get(key: string): Promise<any> {
        const path = this.getPath(key);

        if (!fs.existsSync(path)) {
            return null;
        }

        try {
            const content = fs.readFileSync(path, 'utf8');
            const data = JSON.parse(content);

            if (data.expiration && Date.now() / 1000 > data.expiration) {
                await this.forget(key);
                return null;
            }

            return data.value;
        } catch (e) {
            return null;
        }
    }

    public async put(key: string, value: any, seconds: number): Promise<void> {
        const path = this.getPath(key);
        const expiration = seconds > 0 ? (Date.now() / 1000) + seconds : 0;

        const data = {
            value,
            expiration
        };

        try {
            this.ensureDirectoryExists(path);
            fs.writeFileSync(path, JSON.stringify(data), 'utf8');
        } catch (e) {
            // Silently fail or log
        }
    }

    public async increment(key: string, value: number = 1): Promise<number> {
        const current = await this.get(key);
        const newValue = (typeof current === 'number' ? current : 0) + value;
        await this.put(key, newValue, 0);
        return newValue;
    }

    public async decrement(key: string, value: number = 1): Promise<number> {
        return this.increment(key, -value);
    }

    public async forever(key: string, value: any): Promise<void> {
        await this.put(key, value, 0);
    }

    public async forget(key: string): Promise<void> {
        const path = this.getPath(key);
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }

    public async flush(): Promise<void> {
        if (fs.existsSync(this.directory)) {
            this.deleteFolderRecursive(this.directory);
            this.ensureDirectoryExists();
        }
    }

    public getPrefix(): string {
        return this.prefix;
    }

    protected getPath(key: string): string {
        // Simple hash-based partitioning like Laravel: 2 levels deep
        const hash = this.sha1(this.prefix + key);
        const folder1 = hash.substring(0, 2);
        const folder2 = hash.substring(2, 4);

        return path.join(this.directory, folder1, folder2, hash);
    }

    protected ensureDirectoryExists(filePath?: string) {
        const dir = filePath ? path.dirname(filePath) : this.directory;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    protected deleteFolderRecursive(dir: string) {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
                const curPath = path.join(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            // Don't delete the root directory itself if it's the cache root
            if (dir !== this.directory) {
                fs.rmdirSync(dir);
            }
        }
    }

    protected sha1(str: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha1').update(str).digest('hex');
    }
}
