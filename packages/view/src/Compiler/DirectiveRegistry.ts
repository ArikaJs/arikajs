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
        this.register('while', (exp, children) => `while (${exp}) {\n${children}\n}`);

        // Custom $loop tracking for foreach
        this.register('foreach', (exp, children) => {
            const match = (exp || '').match(/(.+?)\s+as\s+(\S+)(?:\s*,\s*(\S+))?/);
            if (!match) return `for (${exp}) {\n${children}\n}`;

            const collection = match[1].replace(/^\$/, '');
            const value = match[2].replace(/^\$/, '');
            const key = match[3]?.replace(/^\$/, '');

            return `{
                const __fc = ${collection} || [];
                const __items = Array.isArray(__fc) ? __fc : Object.entries(__fc);
                const __count = __items.length;
                let __iteration = 0;
                
                for (const __item of __items) {
                    __iteration++;
                    const ${key || '__k'} = Array.isArray(__fc) ? (__iteration - 1) : __item[0];
                    const ${value} = Array.isArray(__fc) ? __item : __item[1];
                    
                    const $loop = {
                        index: __iteration - 1,
                        iteration: __iteration,
                        remaining: __count - __iteration,
                        count: __count,
                        first: __iteration === 1,
                        last: __iteration === __count,
                        even: __iteration % 2 === 0,
                        odd: __iteration % 2 !== 0
                    };
                    
                    ${children}
                }
            }`;
        });

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
        this.register('extend', (exp) => `_engine.extend(${exp});`);
        this.register('include', (exp) => `_output += await _engine.render(${exp}, _data, true);`);
        this.register('includeIf', (exp) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const view = args[0];
            const data = args[1] || '_data';
            return `if (_engine.exists(${view})) { _output += await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('includeWhen', (exp) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const condition = args[0];
            const view = args[1];
            const data = args[2] || '_data';
            return `if (${condition}) { _output += await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('includeUnless', (exp) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const condition = args[0];
            const view = args[1];
            const data = args[2] || '_data';
            return `if (!(${condition})) { _output += await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('yield', (exp) => `_output += _engine.yield(${exp});`);

        // Assets
        this.register('vite', (exp) => {
            return `{
                const __scripts = Array.isArray(${exp}) ? ${exp} : [${exp}];
                const __isDev = !!(_data.env && (_data.env.APP_ENV === 'development' || _data.env.APP_ENV === 'local') || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development'));
                const __url = (_data.env && _data.env.APP_URL) || 'http://localhost:3000';
                
                if (__isDev) {
                    _output += \`<script type="module" src="http://localhost:5173/@vite/client"></script>\`;
                    for (const s of __scripts) {
                        _output += \`<script type="module" src="http://localhost:5173/\${s}"></script>\`;
                    }
                } else {
                    for (const s of __scripts) {
                        _output += \`<script type="module" src="\${__url}/build/\${s}"></script>\`;
                    }
                }
            }`;
        });
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
        this.register('role', (exp, children) => `if (_data.user && _data.user.role === ${exp}) {\n${children}\n}`);

        // Authorization (@can / @cannot / @canany)
        this.register('can', (exp, children) => `if (_data.__can && await _data.__can(${exp})) {\n${children}\n}`);
        this.register('cannot', (exp, children) => `if (!_data.__can || !(await _data.__can(${exp}))) {\n${children}\n}`);
        this.register('canany', (exp, children) => {
            return `{
                const __perms = Array.isArray(${exp}) ? ${exp} : [${exp}];
                const __canAny = _data.__can ? (await Promise.all(__perms.map(p => _data.__can(p)))).some(Boolean) : false;
                if (__canAny) {\n${children}\n}
            }`;
        });

        // Async
        this.register('await', (exp, children) => {
            return `_output += await (${exp});`;
        });

        this.register('json', (exp) => `_output += JSON.stringify(${exp});`);
        this.register('js', (exp) => `_output += ${exp};`);
        this.register('dump', (exp) => `_output += \`<pre>\${JSON.stringify(${exp}, null, 2)}</pre>\`;`);
        this.register('dd', (exp) => `_output += \`<pre>\${JSON.stringify(${exp}, null, 2)}</pre>\`; return _output;`);

        // HTMX / Fragments
        this.register('fragment', (exp, children) => {
            return `if (!_engine.isFragmentMode() || _engine.getFragment() === ${exp}) {\n${children}\n}`;
        });

        // SPA Engine Configuration (@spa)
        this.register('spa', () => {
            const spaScript = `<script data-spa-ignore>
(function() {
    const cache = new Map();
    const dispatch = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link || link.target || link.origin !== window.location.origin || link.getAttribute('href').startsWith('#') || link.getAttribute('href').startsWith('javascript:') || link.hasAttribute('data-spa-ignore')) return;
        
        e.preventDefault();
        const url = link.href;
        dispatch('arika:spa:start', { url });

        try {
            let html;
            if (cache.has(url)) {
                html = cache.get(url);
            } else {
                const response = await fetch(url, { headers: { 'X-Arika-Spa': 'true' } });
                if (!response.ok) throw new Error('Network error');
                html = await response.text();
                cache.set(url, html);
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const updateDOM = () => {
                document.title = doc.title;
                document.body.innerHTML = doc.body.innerHTML;
                
                document.querySelectorAll('script').forEach(oldScript => {
                    if (oldScript.hasAttribute('data-spa-ignore')) return;
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.textContent = oldScript.textContent;
                    oldScript.replaceWith(newScript);
                });
                
                window.history.pushState({}, '', url);
                dispatch('arika:spa:end', { url });
            };

            if (document.startViewTransition) {
                document.startViewTransition(updateDOM);
            } else {
                updateDOM();
            }
        } catch (err) {
            console.error('[SPA] Navigation failed:', err);
            window.location.href = url;
        }
    });

})();
</script>`;
            return `_output += ${JSON.stringify(spaScript)};`;
        });

        // --- FORM HELPERS ---

        // @csrf -> hidden input with CSRF token from _data._csrf
        this.register('csrf', () => '_output += `<input type="hidden" name="_token" value="${(_data._csrf || "")}">`;');

        // @method('PUT') -> hidden method spoofing input
        this.register('method', (exp) => `_output += \`<input type="hidden" name="_method" value="\${${exp}}">\`;`);

        // @error('field') ... @enderror
        this.register('error', (exp, children) => {
            return `{
                const __fieldErrors = _data.errors && _data.errors[${exp}];
                if (__fieldErrors) {
                    const message = Array.isArray(__fieldErrors) ? __fieldErrors[0] : __fieldErrors;
                    ${children}
                }
            }`;
        });

        // --- CONDITIONAL ATTRIBUTES ---

        this.register('checked', (exp) => `_output += (${exp}) ? ' checked' : '';`);
        this.register('selected', (exp) => `_output += (${exp}) ? ' selected' : '';`);
        this.register('disabled', (exp) => `_output += (${exp}) ? ' disabled' : '';`);
        this.register('required', (exp) => `_output += (${exp}) ? ' required' : '';`);
        this.register('readonly', (exp) => `_output += (${exp}) ? ' readonly' : '';`);

        // @class({'cls-a': condition, 'cls-b': true})
        this.register('class', (exp) => {
            return `{
                const __classMap = ${exp};
                const __classes = Object.entries(__classMap).filter(([, v]) => Boolean(v)).map(([c]) => c).join(' ');
                _output += __classes ? \` class="\${__classes}"\` : '';
            }`;
        });

        // @style({'color:red': condition})
        this.register('style', (exp) => {
            return `{
                const __styleMap = ${exp};
                const __styles = Object.entries(__styleMap).filter(([, v]) => Boolean(v)).map(([s]) => s).join('; ');
                _output += __styles ? \` style="\${__styles}"\` : '';
            }`;
        });



        // --- EXISTENCE CHECKS ---

        this.register('isset', (exp, children) => `if (typeof ${exp} !== 'undefined' && ${exp} !== null) {\n${children}\n}`);
        this.register('unset', (exp, children) => `if (typeof ${exp} === 'undefined' || ${exp} === null) {\n${children}\n}`);

        // --- ENVIRONMENT ---

        this.register('env', (exp, children) => {
            return `{
                const __envs = Array.isArray(${exp}) ? ${exp} : [${exp}];
                const __currentEnv = (_data.__env || process.env.NODE_ENV || 'production');
                if (__envs.includes(__currentEnv)) {\n${children}\n}
            }`;
        });
        this.register('production', (exp, children) => {
            return `if ((_data.__env || process.env.NODE_ENV) === 'production') {\n${children}\n}`;
        });

        // --- FORELSE ---

        // @forelse(collection as item) ... @empty ... @endforelse
        this.register('forelse', (exp, children) => {
            const emptyMarker = '/* __FORELSE_EMPTY__ */';
            const parts = (children || '').split(emptyMarker);
            const loopBody = parts[0] || '';
            const emptyBody = parts[1] || '';

            const match = (exp || '').match(/(.+?)\s+as\s+(\S+)(?:\s*,\s*(\S+))?/);
            if (!match) return `/* @forelse: invalid expression */`;

            const collection = match[1].replace(/^\$/, '');
            const value = match[2].replace(/^\$/, '');
            const key = match[3]?.replace(/^\$/, '');

            return `{
                const __fc = ${collection} || [];
                const __items = Array.isArray(__fc) ? __fc : Object.entries(__fc);
                const __count = __items.length;
                if (__count > 0) {
                    let __iteration = 0;
                    for (const __item of __items) {
                        __iteration++;
                        const ${key || '__k'} = Array.isArray(__fc) ? (__iteration - 1) : __item[0];
                        const ${value} = Array.isArray(__fc) ? __item : __item[1];
                        
                        const $loop = {
                            index: __iteration - 1,
                            iteration: __iteration,
                            remaining: __count - __iteration,
                            count: __count,
                            first: __iteration === 1,
                            last: __iteration === __count,
                            even: __iteration % 2 === 0,
                            odd: __iteration % 2 !== 0
                        };
                        
                        ${loopBody}
                    }
                } else {
                    ${emptyBody}
                }
            }`;
        });

        // @empty inside @forelse - inserts split marker; standalone @empty(collection) as before
        this.register('empty', (exp, children) => {
            if (!exp && children === undefined) {
                return '/* __FORELSE_EMPTY__ */';
            }
            if (exp) {
                return `if (!(${exp}) || (Array.isArray(${exp}) && ${exp}.length === 0)) {\n${children}\n}`;
            }
            return `/* __FORELSE_EMPTY__ */ ${children || ''}`;
        });

        // --- TRANSLATION ---

        this.register('lang', (exp) => `_output += _escape((_data.__t && _data.__t(${exp})) || ${exp});`);
        this.register('t', (exp) => `_output += _escape((_data.__t && _data.__t(${exp})) || ${exp});`);
        this.register('choice', (exp) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const key = args[0];
            const count = args[1] || '1';
            return `_output += _escape((_data.__choice && _data.__choice(${key}, ${count})) || ${key});`;
        });

    }
}
