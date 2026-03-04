
export interface Application {
    getBasePath(): string;
    getContainer(): any;
    config(): any;
    register(provider: any): void;
    boot(): Promise<void>;
    run(): Promise<void>;
    bind(token: any, factory: any): void;
    singleton(token: any, factory: any): void;
    instance(token: any, value: any): void;
    make<T = any>(token: any): T;
    resolve<T = any>(token: any): T;
    alias(token: any, alias: any): void;
    tag(token: any, tag: string): void;
    tagged<T = any>(tag: string): T[];
    extend<T = any>(token: any, callback: (instance: T) => T): void;
    terminate(): Promise<void>;
    isBooted(): boolean;
}
