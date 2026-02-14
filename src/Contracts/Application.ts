
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
    register(provider: any): void;
    boot(): Promise<void>;
    run(): Promise<void>;
    isBooted(): boolean;
}
