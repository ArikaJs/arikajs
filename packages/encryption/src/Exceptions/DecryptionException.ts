export class DecryptionException extends Error {
    constructor(message: string = 'The payload is invalid or has been tampered with.') {
        super(message);
        this.name = 'DecryptionException';
    }
}
