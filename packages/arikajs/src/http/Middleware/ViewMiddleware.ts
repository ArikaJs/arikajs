
import { View } from '@arikajs/view';
import crypto from 'node:crypto';

export class ViewMiddleware {
    constructor(private view: View) { }

    public async handle(request: any, next: (request: any) => Promise<any>): Promise<any> {
        let token = '';

        // Ensure CSRF token exists in session
        if (request.session) {
            token = await request.session.get('_token');
            if (!token) {
                token = crypto.randomBytes(40).toString('hex');
                await request.session.set('_token', token);
            }
        }

        // Extract temporary session flash data
        const sessionErrors = request.session ? (await request.session.get('_errors') || {}) : {};
        const oldInput = request.session ? (await request.session.get('_old_input') || {}) : {};
        const currentUser = request.auth ? await request.auth.user() : null;

        // Create a strictly request-scoped view renderer!
        // This completely prevents concurrency session leaks between users.
        request.view = {
            render: async (template: string, data: any = {}) => {
                // Safely format the ErrorBag so templates can call errors.has('name')
                const ErrorBag = {
                    any: () => Object.keys(sessionErrors).length > 0,
                    all: () => Object.values(sessionErrors).flat(),
                    first: (field: string) => sessionErrors[field]?.[0] || null,
                    has: (field: string) => !!sessionErrors[field]
                };

                const scopedData = {
                    _csrf: token,
                    errors: ErrorBag,
                    _old_input: oldInput,
                    user: currentUser,
                    
                    // Add legacy `old(key, default)` helper explicitly isolated to this request
                    old: (key: string, defaultValue = '') => oldInput[key] || defaultValue,
                };

                return this.view.render(template, { ...scopedData, ...data });
            },
            
            // Still allow true core global sharing if needed
            share: (key: string, value: any) => this.view.share(key, value)
        };

        return await next(request);
    }
}
