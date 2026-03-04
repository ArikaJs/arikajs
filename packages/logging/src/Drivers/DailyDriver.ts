
import { Logger } from '../Contracts/Logger';
import { FileDriver } from './FileDriver';
import path from 'path';

export class DailyDriver extends FileDriver implements Logger {
    constructor(config: any) {
        const date = new Date().toISOString().split('T')[0];
        const parsedPath = path.parse(config.path || 'app.log');
        const dailyPath = path.join(parsedPath.dir, `${parsedPath.name}-${date}${parsedPath.ext}`);

        super({ ...config, path: dailyPath });
    }
}
