export interface Transport {
    send(message: any): Promise<void>;
}
