import * as fs from 'node:fs';
import * as path from 'node:path';
import { ViewConfig } from './Engine';

export class Template {
    constructor(private config: ViewConfig) { }

    /**
     * Resolve and read template content.
     */
    public read(template: string): string {
        const filePath = this.resolvePath(template);
        if (!fs.existsSync(filePath)) {
            throw new Error(`View template not found: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * Resolve template name to file path.
     */
    private resolvePath(template: string): string {
        const ext = this.config.extension || '.ark.html';
        const fileName = template.replace(/\./g, path.sep) + ext;
        return path.join(this.config.viewsPath, fileName);
    }
}
