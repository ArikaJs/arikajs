
export interface Formatter {
    format(level: string, message: string, context?: any): string;
}
