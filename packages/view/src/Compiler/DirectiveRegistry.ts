export type DirectiveHandler = (expression: string | null, children?: string) => string;

export class DirectiveRegistry {
    private directives: Map<string, DirectiveHandler> = new Map();

    constructor() {
        this.registerDefaultDirectives();
    }

    public register(name: string, handler: DirectiveHandler): void {
        this.directives.set(name, handler);
    }

    public has(name: string): boolean {
        return this.directives.has(name);
    }

    public handle(name: string, expression: string | null, children?: string): string | null {
        const handler = this.directives.get(name);
        if (handler) {
            return handler(expression, children);
        }
        return null;
    }

    private registerDefaultDirectives(): void {
        // Conditionals
        this.register('if', (exp, children) => `if (${exp}) {\n${children}\n}`);
        this.register('elseif', (exp) => `} else if (${exp}) {`);
        this.register('else', () => `} else {`);
        this.register('unless', (exp, children) => `if (!(${exp})) {\n${children}\n}`);
        this.register('empty', (exp, children) => `if (!(${exp}) || (Array.isArray(${exp}) && ${exp}.length === 0)) {\n${children}\n}`);

        // Loops
        this.register('for', (exp, children) => `for (${exp}) {\n${children}\n}`);
        this.register('each', (exp, children) => {
            // @each('view', data, 'item', 'empty')
            const args = exp?.split(',').map(a => a.trim()) || [];
            const view = args[0];
            const collection = args[1];
            const item = args[2] ? args[2].replace(/['"]/g, '') : 'item';
            const emptyView = args[3];

            return `
                const __items = ${collection};
                if (__items && __items.length > 0) {
                    for (const ${item} of __items) {
                        _output += await _engine.render(${view}, { ..._data, ${item} }, true);
                    }
                } else if (${emptyView}) {
                    _output += await _engine.render(${emptyView}, _data, true);
                }
            `;
        });
        this.register('break', (exp) => exp ? `if (${exp}) break;` : 'break;');
        this.register('continue', (exp) => exp ? `if (${exp}) continue;` : 'continue;');

        // Switch
        this.register('switch', (exp, children) => `switch (${exp}) {\n${children}\n}`);
        this.register('case', (exp) => `case ${exp}:`);
        this.register('default', () => `default:`);

        // Layouts & Includes
        this.register('extends', (exp) => `_engine.extend(${exp});`);
        this.register('include', (exp) => `_output += await _engine.render(${exp}, _data, true);`);
        this.register('yield', (exp) => `_output += _engine.yield(${exp});`);
        this.register('section', (exp, children) => {
            return `_engine.startSection(${exp}, _output); _output = "";\n${children}\n _output = _engine.popSection(_output);`;
        });

        // Stacks
        this.register('push', (exp, children) => {
            return `_engine.startPush(${exp}, _output); _output = "";\n${children}\n _output = _engine.endPush(_output);`;
        });
        this.register('prepend', (exp, children) => {
            return `_engine.startPrepend(${exp}, _output); _output = "";\n${children}\n _output = _engine.endPrepend(_output);`;
        });
        this.register('stack', (exp) => `_output += _engine.stack(${exp});`);

        // Components
        this.register('component', (exp, children) => {
            return `_engine.startComponent(${exp}, _output); _output = "";\n${children}\n _output = await _engine.renderComponent(_output);`;
        });
        this.register('slot', (exp, children) => {
            return `_engine.startSlot(${exp}, _output); _output = "";\n${children}\n _output = _engine.endSlot(_output);`;
        });

        // Security & Utils
        this.register('verbatim', (exp, children) => `_output += \`${children?.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;`);
        this.register('once', (exp, children) => {
            const id = Math.random().toString(36).substring(7);
            return `if (!_engine.hasOnce('${id}')) { _engine.markOnce('${id}'); ${children} }`;
        });

        // Auth Integration
        this.register('auth', (exp, children) => `if (_data.user) {\n${children}\n}`);
        this.register('guest', (exp, children) => `if (!_data.user) {\n${children}\n}`);

        // Async
        this.register('await', (exp, children) => {
            return `_output += await (${exp});`;
        });

        // Utils
        this.register('php', (exp, children) => children || '');
        this.register('json', (exp) => `_output += JSON.stringify(${exp});`);

        // HTMX / Fragments
        this.register('fragment', (exp, children) => {
            return `if (!_engine.isFragmentMode() || _engine.getFragment() === ${exp}) {\n${children}\n}`;
        });
    }
}
