import { Transport } from '../Contracts/Transport';

export class ArrayTransport implements Transport {
    public messages: any[] = [];

    async send(message: any): Promise<void> {
        this.messages.push(message);
    }

    /**
     * Clear all stored messages.
     */
    public clear(): void {
        this.messages = [];
    }

    /**
     * Get all stored messages.
     */
    public getMessages(): any[] {
        return this.messages;
    }
}
