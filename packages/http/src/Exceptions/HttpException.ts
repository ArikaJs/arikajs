
export class HttpException extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public originalError: any = null
    ) {
        super(message);
        this.name = 'HttpException';
    }

    public getStatusCode(): number {
        return this.statusCode;
    }
}

export class NotFoundHttpException extends HttpException {
    constructor(message: string = 'Not Found', originalError: any = null) {
        super(404, message, originalError);
        this.name = 'NotFoundHttpException';
    }
}

export class MethodNotAllowedHttpException extends HttpException {
    constructor(message: string = 'Method Not Allowed', originalError: any = null) {
        super(405, message, originalError);
        this.name = 'MethodNotAllowedHttpException';
    }
}

export class UnauthorizedHttpException extends HttpException {
    constructor(message: string = 'Unauthorized', originalError: any = null) {
        super(401, message, originalError);
        this.name = 'UnauthorizedHttpException';
    }
}
