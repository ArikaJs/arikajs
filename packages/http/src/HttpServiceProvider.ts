import { HttpKernel } from './HttpKernel';

export class HttpServiceProvider {
    constructor(protected app: any) { }

    /**
     * Register the service provider.
     */
    register() {
        this.app.singleton(HttpKernel, (app: any) => {
            return new HttpKernel(app);
        });
    }

    /**
     * Boot the service provider.
     */
    boot() {
        //
    }
}
