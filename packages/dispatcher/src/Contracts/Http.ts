
export interface Request {
    [key: string]: any;
}

export interface Response {
    status(code: number): this;
    send(data: any, status?: number): this;
    json(data: any, status?: number): this;
    [key: string]: any;
}
