
import { View } from '@arikajs/view';
import crypto from 'node:crypto';

export class ViewMiddleware {
    constructor(private view: View) { }

    public async handle(request: any, next: (request: any) => Promise<any>): Promise<any> {
        // Attach the view engine to the request object
        request.view = this.view;

        // Ensure CSRF token exists in session and share it with views
        if (request.session) {
            let token = await request.session.get('_token');
            if (!token) {
                token = crypto.randomBytes(40).toString('hex');
                await request.session.set('_token', token);
            }
            this.view.share('_csrf', token);
        }

        return await next(request);
    }
}
