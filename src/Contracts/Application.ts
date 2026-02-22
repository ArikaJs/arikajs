
import { Router } from '@arikajs/router';
import { Application as HttpApplicationContract } from '@arikajs/http';

export interface Application extends HttpApplicationContract {
    getRouter(): Router;
    getContainer(): any;
    getBasePath(): string;
    make<T = any>(token: any): T;
    singleton<T = any>(token: any, factory: any): void;
    instance<T = any>(token: any, value: T): void;
    bind<T = any>(token: any, factory: any): void;
    resolve<T = any>(token: any): T;
    alias(token: any, alias: any): void;
    tag(token: any, tag: string): void;
    tagged<T = any>(tag: string): T[];
    extend<T = any>(token: any, callback: (instance: T) => T): void;
    register(provider: any): void;
    boot(): Promise<void>;
    run(): Promise<void>;
    terminate(): Promise<void>;
    isBooted(): boolean;
}
