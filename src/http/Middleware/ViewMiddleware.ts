
import { View } from '@arikajs/view';

export class ViewMiddleware {
    constructor(private view: View) { }

    public async handle(request: any, next: (request: any) => Promise<any>): Promise<any> {
        // Attach the view engine to the request object
        request.view = this.view;

        return await next(request);
    }
}
