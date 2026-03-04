
export interface Container {
    make<T = any>(token: any): T;
}
