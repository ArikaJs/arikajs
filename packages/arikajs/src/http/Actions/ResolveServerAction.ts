import { Request, Response } from '@arikajs/http';
import { Application } from '../../Contracts/Application';
import { ActionDispatcher } from './ActionDispatcher';

/**
 * ResolveServerAction Middleware
 * 
 * Intercepts requests that contain the '_action' field and dispatches them
 * to the appropriate controller method, bypassing traditional routing.
 */
export class ResolveServerAction {
    constructor(private app: Application) {}

    public async handle(request: Request, next: (req: Request) => Promise<Response>, response: Response): Promise<Response> {
        // Only process if it's a mutation request with an action trigger
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method().toUpperCase()) && request.input('_action')) {
            const dispatcher = new ActionDispatcher(this.app);
            
            try {
                const actionResponse = await dispatcher.dispatch(request, response);
                
                if (actionResponse) {
                    return actionResponse;
                }
            } catch (e: any) {
                // Let the global Exception Handler deal with HttpExceptions and others
                throw e;
            }
        }

        return next(request);
    }
}
