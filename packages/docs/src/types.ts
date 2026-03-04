// src/types.ts
export interface ParsedRoute {
    method: string;
    path: string;
    name?: string;
    prefix?: string;
    middleware: string[];
    paramKeys: string[];
    handler?: string;
}
