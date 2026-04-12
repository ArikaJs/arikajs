import { Engine, ViewConfig, ViewComposer, ViewHelper } from './Engine';

export class View {
    private _engine: Engine;
    public readonly config: ViewConfig;

    constructor(config: ViewConfig) {
        this.config = config;
        this._engine = new Engine(config);
    }

    /**
     * Access the underlying view engine.
     */
    public engine(): Engine {
        return this._engine;
    }

    /**
     * Add a custom directive to the template compiler.
     */
    public directive(name: string, handler: (expression: string | null, children?: string) => string): this {
        this._engine.directive(name, handler);
        return this;
    }

    /**
     * Add a view composer.
     */
    public composer(template: string, callback: ViewComposer): this {
        this._engine.composer(template, callback);
        return this;
    }

    /**
     * Add a global helper.
     */
    public helper(name: string, callback: ViewHelper): this {
        this._engine.helper(name, callback);
        return this;
    }

    /**
     * Share data explicitly across all templates rendered by this view instance.
     */
    public share(key: string, value: any): this {
        this._engine.share(key, value);
        return this;
    }

    /**
     * Render a template with data.
     */
    public async render<T = Record<string, any>>(template: string, data: T = {} as T): Promise<string> {
        return this._engine.render<T>(template, data);
    }

    /**
     * Render a fragment of a template.
     */
    public async renderFragment(template: string, fragment: string, data: any = {}): Promise<string> {
        return this._engine.renderFragment(template, fragment, data);
    }

    /**
     * Render a view to a stream (Node.js Readable or standard Web ReadableStream).
     */
    public async stream(view: string, data: any = {}, options: { webStream?: boolean } = {}): Promise<any> {
        return this._engine.stream(view, data, options);
    }
}
