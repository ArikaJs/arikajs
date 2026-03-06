import http from 'http';

export class RawResponse {
    private res: http.ServerResponse;
    public static dateCache: string = new Date().toUTCString();

    constructor(res: http.ServerResponse) {
        this.res = res;
    }

    public static setupDateUpdater() {
        setInterval(() => {
            RawResponse.dateCache = new Date().toUTCString();
        }, 1000).unref();
    }

    public sendUltra(body: Buffer | string): void {
        const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : body;

        this.res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': bodyBuffer.length,
            'Date': RawResponse.dateCache,
            'Connection': 'keep-alive'
        });
        this.res.end(bodyBuffer);
    }
}

RawResponse.setupDateUpdater();
