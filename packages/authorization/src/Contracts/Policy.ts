export interface Policy {
    [method: string]: ((user: any, ...args: any[]) => boolean | Promise<boolean>) | any;
}
