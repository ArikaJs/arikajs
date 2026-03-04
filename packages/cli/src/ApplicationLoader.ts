
import path from 'path';
import fs from 'fs';

export class ApplicationLoader {
    public static findRoot(): string {
        let current = process.cwd();

        while (current !== path.dirname(current)) {
            if (fs.existsSync(path.join(current, 'package.json'))) {
                return current;
            }
            current = path.dirname(current);
        }

        return process.cwd();
    }

    public static async load() {
        const root = this.findRoot();
        // In a real scenario, we would load the application from the project root
        // and boot the foundation.
        return {
            root,
            isArikaProject: fs.existsSync(path.join(root, 'arika.json')) || fs.existsSync(path.join(root, 'kernel.ts'))
        };
    }
}
