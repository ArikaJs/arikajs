
export interface Logger {
    emergency(message: string, context?: any): void;
    alert(message: string, context?: any): void;
    critical(message: string, context?: any): void;
    error(message: string, context?: any): void;
    warning(message: string, context?: any): void;
    notice(message: string, context?: any): void;
    info(message: string, context?: any): void;
    debug(message: string, context?: any): void;
    log(level: string, message: string, context?: any): void;
}
