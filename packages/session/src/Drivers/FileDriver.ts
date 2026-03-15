import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { SessionDriver } from '../Contracts/SessionDriver';

interface FileSessionEntry {
    data: Record<string, any>;
    expiresAt: number; // Unix ms
}

/**
 * FileDriver — stores sessions as JSON files on disk.
 * Suitable for single-server applications. Supports GC via file scanning.
 */
export class FileDriver implements SessionDriver {
    constructor(private readonly directory: string) {
        this.ensureDirectory();
    }

    private ensureDirectory(): void {
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory, { recursive: true });
        }
    }

    private filePath(sessionId: string): string {
        // Use a simple hash-based subdirectory to avoid huge flat folders
        const hash = crypto.createHash('md5').update(sessionId).digest('hex');
        const sub = hash.slice(0, 2);
        const dir = path.join(this.directory, sub);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return path.join(dir, `${sessionId}.json`);
    }

    public async load(sessionId: string): Promise<Record<string, any> | null> {
        const file = this.filePath(sessionId);
        if (!fs.existsSync(file)) return null;

        try {
            const raw = fs.readFileSync(file, 'utf8');
            const entry: FileSessionEntry = JSON.parse(raw);

            if (Date.now() > entry.expiresAt) {
                fs.unlinkSync(file);
                return null;
            }

            return entry.data;
        } catch {
            return null;
        }
    }

    public async save(sessionId: string, data: Record<string, any>, ttlSeconds: number): Promise<void> {
        const file = this.filePath(sessionId);
        const entry: FileSessionEntry = {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        };

        try {
            fs.writeFileSync(file, JSON.stringify(entry), 'utf8');
        } catch {
            // Silently fail — don't crash the request
        }
    }

    public async destroy(sessionId: string): Promise<void> {
        const file = this.filePath(sessionId);
        if (fs.existsSync(file)) {
            try { fs.unlinkSync(file); } catch { }
        }
    }

    public async gc(maxLifetimeSeconds: number): Promise<void> {
        const now = Date.now();
        const maxMs = maxLifetimeSeconds * 1000;

        const scanDir = (dir: string) => {
            if (!fs.existsSync(dir)) return;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    scanDir(fullPath);
                } else if (entry.name.endsWith('.json')) {
                    try {
                        const raw = fs.readFileSync(fullPath, 'utf8');
                        const session: FileSessionEntry = JSON.parse(raw);
                        if (now > session.expiresAt) {
                            fs.unlinkSync(fullPath);
                        }
                    } catch {
                        // Corrupt file — remove it
                        try { fs.unlinkSync(fullPath); } catch { }
                    }
                }
            }
        };

        scanDir(this.directory);
    }

    public async acquireLock(sessionId: string, timeoutSeconds: number): Promise<boolean> {
        const lockPath = this.filePath(sessionId) + '.lock';
        if (fs.existsSync(lockPath)) {
            try {
                const stat = fs.statSync(lockPath);
                // If it's stale, break it
                if (Date.now() - stat.mtimeMs > timeoutSeconds * 1000) {
                    fs.unlinkSync(lockPath);
                } else {
                    return false;
                }
            } catch {
                return false;
            }
        }
        try {
            fs.writeFileSync(lockPath, '', { flag: 'wx' });
            return true;
        } catch {
            return false;
        }
    }

    public async releaseLock(sessionId: string): Promise<void> {
        const lockPath = this.filePath(sessionId) + '.lock';
        if (fs.existsSync(lockPath)) {
            try { fs.unlinkSync(lockPath); } catch { }
        }
    }
}
