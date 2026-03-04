import { ParsedRoute } from '../types';

export interface DocDriver {
    generate(routes: ParsedRoute[], appName: string, baseUrl?: string): any;
    getExtension(): string;
    getFilename(appName: string): string;
}
