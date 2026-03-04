
export class EventException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EventException';
    }
}
