
export interface Application {
    config(): any;
    isBooted(): boolean;
    boot(): Promise<void>;
    make<T = any>(token: any): T;
    singleton<T = any>(token: any, factory: any): void;
    getContainer(): any;
}
