
import { Application } from '../Application';

export class Kernel {
    constructor(protected app: Application) { }

    public async handle(request: any): Promise<any> {
        // This will eventually link router -> dispatcher -> middleware
        return this.app.getRouter().dispatch(request);
    }
}
