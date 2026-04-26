import { Handler as BaseHandler } from 'arikajs';

export class Handler extends BaseHandler {
    /**
     * Report or log an exception.
     */
    public report(error: any): void {
        super.report(error);
    }

    /**
     * Register the exception handling callbacks for the application.
     */
    public register(): void {
        //
    }
}


