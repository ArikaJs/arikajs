
export interface Listener {
    handle(event: any): Promise<void> | void;
    shouldQueue?: boolean;
}
