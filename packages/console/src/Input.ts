
export class Input {
    constructor(
        protected arguments_list: Map<string, any> = new Map(),
        protected options_list: Map<string, any> = new Map()
    ) { }

    public argument(key: string, defaultValue: any = null): any {
        return this.arguments_list.has(key) ? this.arguments_list.get(key) : defaultValue;
    }

    public option(key: string, defaultValue: any = null): any {
        return this.options_list.has(key) ? this.options_list.get(key) : defaultValue;
    }

    public setArguments(args: Map<string, any>) {
        this.arguments_list = args;
    }

    public setOptions(options: Map<string, any>) {
        this.options_list = options;
    }
}
