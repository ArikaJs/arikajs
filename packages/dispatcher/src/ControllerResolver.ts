export class ControllerResolver {
    constructor(private container: any) { }

    /**
     * Resolve the controller instance and method name.
     */
    public resolve(handler: any[]): { controller: any; method: string } {
        const [controllerClass, method] = handler;

        if (!this.container) {
            throw new Error('Container required for controller resolution.');
        }

        const controller = this.container.make(controllerClass) as any;

        if (typeof controller[method] !== 'function') {
            throw new Error(
                `Controller method "${method}" not found on ${controllerClass.name || controllerClass}.`
            );
        }

        return { controller, method };
    }
}
