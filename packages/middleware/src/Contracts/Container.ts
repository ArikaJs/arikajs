
export interface Container {
    make<T = any>(token: any): T;
    has(token: any): boolean;
}
