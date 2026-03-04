export interface Guard {
    check(): boolean | Promise<boolean>;
    guest(): boolean | Promise<boolean>;
    user(): any | Promise<any>;
    id(): string | number | null | Promise<string | number | null>;
    validate(credentials: Record<string, any>): boolean | Promise<boolean>;
    setUser(user: any): void;
    setRequest?(request: any): void;
}
