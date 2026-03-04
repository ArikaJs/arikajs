import { Engine, ViewConfig, ViewComposer, ViewHelper } from './Engine';

export class View {
    private engine: Engine;

    constructor(config: ViewConfig) {
        this.engine = new Engine(config);
    }

    /**
     * Add a custom directive to the template compiler.
     */
    public directive(name: string, handler: (expression: string | null, children?: string) => string): this {
        this.engine.directive(name, handler);
        return this;
    }

    /**
     * Add a view composer.
     */
    public composer(template: string, callback: ViewComposer): this {
        this.engine.composer(template, callback);
        return this;
    }

    /**
     * Add a global helper.
     */
    public helper(name: string, callback: ViewHelper): this {
        this.engine.helper(name, callback);
        return this;
    }

    /**
     * Share data explicitly across all templates rendered by this view instance.
     */
    public share(key: string, value: any): this {
        this.engine.share(key, value);
        return this;
    }

    /**
     * Render a template with data.
     */
    public async render<T = Record<string, any>>(template: string, data: T = {} as T): Promise<string> {
        return this.engine.render<T>(template, data);
    }

    /**
     * Render a fragment of a template.
     */
    public async renderFragment(template: string, fragment: string, data: any = {}): Promise<string> {
        return this.engine.renderFragment(template, fragment, data);
    }
}
