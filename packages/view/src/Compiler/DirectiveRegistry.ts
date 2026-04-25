export type DirectiveHandler = (expression: string | null, children?: string, append?: string) => string;

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

    public handle(name: string, expression: string | null, children?: string, append: string = '_output += '): string | null {
        const handler = this.directives.get(name);
        if (handler) {
            return handler(expression, children, append);
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
                    
                    const loop = {
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

        this.register('each', (exp, children, append) => {
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
                        ${append} await _engine.render(${view}, { ..._data, ${item} }, true);
                    }
                } else if (${emptyView}) {
                    ${append} await _engine.render(${emptyView}, _data, true);
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
        this.register('extends', (exp, children, append) => `_engine.extend(${exp});`);
        this.register('extend', (exp, children, append) => `_engine.extend(${exp});`);
        this.register('include', (exp, children, append) => `${append} await _engine.render(${exp}, _data, true);`);
        this.register('includeIf', (exp, children, append) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const view = args[0];
            const data = args[1] || '_data';
            return `if (_engine.exists(${view})) { ${append} await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('includeWhen', (exp, children, append) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const condition = args[0];
            const view = args[1];
            const data = args[2] || '_data';
            return `if (${condition}) { ${append} await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('includeUnless', (exp, children, append) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const condition = args[0];
            const view = args[1];
            const data = args[2] || '_data';
            return `if (!(${condition})) { ${append} await _engine.render(${view}, ${data}, true); }`;
        });
        this.register('yield', (exp, children, append) => `${append} _engine.yield(${exp});`);

        // SEO & Meta
        this.register('meta', (exp) => `_engine.setMeta(${exp});`);
        this.register('head', (exp, children, append) => `${append} _engine.renderMeta();`);

        // Assets
        this.register('vite', (exp, children, append) => {
            return `{
                const __scripts = Array.isArray(${exp}) ? ${exp} : [${exp}];
                const __isDev = !!(_data.env && (_data.env.APP_ENV === 'development' || _data.env.APP_ENV === 'local') || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development'));
                const __url = (_data.env && _data.env.APP_URL) || 'http://localhost:3000';
                
                if (__isDev) {
                    ${append} \`<script type="module" src="http://localhost:5173/@vite/client"></script>\`;
                    for (const s of __scripts) {
                        ${append} \`<script type="module" src="http://localhost:5173/\${s}"></script>\`;
                    }
                } else {
                    for (const s of __scripts) {
                        ${append} \`<script type="module" src="\${__url}/build/\${s}"></script>\`;
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
        this.register('stack', (exp, children, append) => `${append} _engine.stack(${exp});`);

        // Components
        this.register('component', (exp, children) => {
            return `_engine.startComponent(${exp}, _output); _output = "";\n${children}\n _output = await _engine.renderComponent(_output);`;
        });
        this.register('slot', (exp, children) => {
            return `_engine.startSlot(${exp}, _output); _output = "";\n${children}\n _output = _engine.endSlot(_output);`;
        });

        // Security & Utils
        this.register('verbatim', (exp, children, append) => `${append} \`${children?.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;`);
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
        this.register('await', (exp, children, append) => {
            return `${append} await (${exp});`;
        });

        this.register('json', (exp, children, append) => `${append} JSON.stringify(${exp});`);
        this.register('js', (exp, children, append) => `${append} ${exp};`);
        this.register('dump', (exp, children, append) => `${append} \`<pre>\${JSON.stringify(${exp}, null, 2)}</pre>\`;`);
        this.register('dd', (exp, children, append) => `${append} \`<pre>\${JSON.stringify(${exp}, null, 2)}</pre>\`; return _output;`);

        // HTMX / Fragments
        this.register('fragment', (exp, children, append) => {
            return `if (!_engine.isFragmentMode() || _engine.getFragment() === ${exp}) {\n${children}\n}`;
        });

        // SPA Engine Configuration (@spa)
        this.register('spa', (exp, children, append) => {
            const spaScript = `<script data-spa-ignore>
(function() {
    const cache = new Map();
    const dispatch = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

    // Global Actions Proxy
    window.actions = new Proxy({}, {
        get(target, name) {
            if (!target[name]) {
                target[name] = {
                    _start: [], _finish: [], _error: [], _always: [], _optimistic: [],
                    start: function(cb) { this._start.push(cb); return this; },
                    finish: function(cb) { this._finish.push(cb); return this; },
                    error: function(cb) { this._error.push(cb); return this; },
                    always: function(cb) { this._always.push(cb); return this; },
                    optimistic: function(cb) { this._optimistic.push(cb); return this; }
                };
            }
            return target[name];
        }
    });

    const updateContent = async (url, html, pushState = true) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 1. Preserve elements with data-preserve
        const preserved = new Map();
        document.querySelectorAll('[data-preserve]').forEach(el => {
            const id = el.id || el.name || el.getAttribute('data-preserve-id') || el.outerHTML.substring(0, 100);
            preserved.set(id, el);
        });

        const updateDOM = () => {
            // Restore Scroll Position for the CURRENT page before leaving
            if (pushState) {
                history.replaceState({ ...history.state, scrollX: window.scrollX, scrollY: window.scrollY }, '');
            }

            document.title = doc.title;
            document.body.innerHTML = doc.body.innerHTML;

            // 2. Re-insert preserved elements
            document.querySelectorAll('[data-preserve]').forEach(newEl => {
                const id = newEl.id || newEl.name || newEl.getAttribute('data-preserve-id') || newEl.outerHTML.substring(0, 100);
                const oldEl = preserved.get(id);
                if (oldEl) {
                    newEl.replaceWith(oldEl);
                }
            });

            document.querySelectorAll('script').forEach(oldScript => {
                if (oldScript.hasAttribute('data-spa-ignore')) return;
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                oldScript.replaceWith(newScript);
            });

            if (pushState) {
                window.history.pushState({ scrollX: 0, scrollY: 0 }, '', url);
            } else {
                // Return to previous scroll
                window.scrollTo(history.state?.scrollX || 0, history.state?.scrollY || 0);
            }
            initLive();
            dispatch('arika:spa:end', { url });
        };

        if (document.startViewTransition) {
            document.startViewTransition(updateDOM);
        } else {
            updateDOM();
        }
    };

    const initLive = (root = document) => {
        root.querySelectorAll('[data-fetch]').forEach(el => {
            if (el.__arika_live) return;
            el.__arika_live = true;
            const fetchContent = async () => {
                try {
                    const res = await fetch(el.dataset.fetch, { headers: { 'X-Arika-Fragment': 'true' } });
                    if (res.ok) el.innerHTML = await res.text();
                } catch (e) { console.error('[Live] Fetch failed:', e); }
            };
            if (el.dataset.interval) setInterval(fetchContent, parseInt(el.dataset.interval));
            window.addEventListener('focus', () => fetchContent());
        });
    };

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
            await updateContent(url, html, true);
        } catch (err) {
            console.error('[SPA] Navigation failed:', err);
            window.location.href = url;
        }
    });

    document.addEventListener('submit', async (e) => {
        const form = e.target;
        const actionInput = form.querySelector('input[name="_action"]');
        if (!actionInput) return;

        e.preventDefault();
        const actionName = actionInput.value;
        const action = window.actions[actionName];
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        action._optimistic.forEach(cb => cb(data));
        action._start.forEach(cb => cb());

        try {
            const response = await fetch(form.action || window.location.href, {
                method: form.method || 'POST',
                headers: { 'X-Arika-Action': actionName, 'Accept': 'application/json' },
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                action._finish.forEach(cb => cb(result));
            } else if (response.status === 422) {
                // Zero-JS Validation Mapping
                const errors = result.errors || {};
                document.querySelectorAll('[data-error-field]').forEach(el => {
                    const field = el.getAttribute('data-error-field');
                    if (errors[field]) {
                        el.innerHTML = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
                        el.removeAttribute('hidden');
                        el.style.display = '';
                    } else {
                        el.setAttribute('hidden', '');
                    }
                });
                action._error.forEach(cb => cb(errors));
            } else {
                action._error.forEach(cb => cb(result.errors || result));
            }
        } catch (err) {
            action._error.forEach(cb => cb(err));
        } finally {
            action._always.forEach(cb => cb());
        }
    });

    window.addEventListener('popstate', async () => {
        const url = window.location.href;
        if (cache.has(url)) {
            await updateContent(url, cache.get(url), false);
        } else {
            window.location.reload();
        }
    });

    // 4. Hover Prefetching
    document.addEventListener('mouseenter', async (e) => {
        const link = e.target.closest('a[data-prefetch]');
        if (!link || cache.has(link.href)) return;
        
        try {
            const response = await fetch(link.href, { headers: { 'X-Arika-Spa': 'true' } });
            if (response.ok) cache.set(link.href, await response.text());
        } catch (e) {}
    }, true);

    initLive();
})();
</script>`;
            return `${append} ${JSON.stringify(spaScript)};`;
        });

        // Smart Data Fetching (@fetch)
        this.register('fetch', (exp, children, append) => `${append} ' data-fetch="' + ${exp} + '"';`);
        this.register('interval', (exp, children, append) => `${append} ' data-interval="' + ${exp} + '"';`);
        this.register('prefetch', (exp, children, append) => `${append} ' data-prefetch'`);

        // --- FORM HELPERS ---

        // @csrf -> hidden input with CSRF token from _data._csrf
        this.register('csrf', (exp, children, append) => `${append} \`<input type="hidden" name="_token" value="\${(_data._csrf || "")}">\`;`);

        // @method('PUT') -> hidden method spoofing input
        this.register('method', (exp, children, append) => `${append} \`<input type="hidden" name="_method" value="\${${exp}}">\`;`);

        // @error('field') ... @enderror
        this.register('error', (exp, children, append) => {
            return `{
                const __fieldErrors = _data.errors && _data.errors[${exp}];
                const __hasError = !!__fieldErrors;
                const __message = Array.isArray(__fieldErrors) ? __fieldErrors[0] : __fieldErrors;
                
                ${append} \`<span data-error-field="\${${exp}}" \${!__hasError ? 'hidden style="display:none"' : ''}>\`;
                if (__hasError) {
                    const message = __message;
                    ${children}
                }
                ${append} \`</span>\`;
            }`;
        });

        // --- CONDITIONAL ATTRIBUTES ---

        this.register('checked', (exp, children, append) => `${append} (${exp}) ? ' checked' : '';`);
        this.register('selected', (exp, children, append) => `${append} (${exp}) ? ' selected' : '';`);
        this.register('disabled', (exp, children, append) => `${append} (${exp}) ? ' disabled' : '';`);
        this.register('required', (exp, children, append) => `${append} (${exp}) ? ' required' : '';`);
        this.register('readonly', (exp, children, append) => `${append} (${exp}) ? ' readonly' : '';`);

        // @class({'cls-a': condition, 'cls-b': true})
        this.register('class', (exp, children, append) => {
            return `{
                const __classMap = ${exp};
                const __classes = Object.entries(__classMap).filter(([, v]) => Boolean(v)).map(([c]) => c).join(' ');
                ${append} __classes ? \` class="\${__classes}"\` : '';
            }`;
        });

        // @style({'color:red': condition})
        this.register('style', (exp, children, append) => {
            return `{
                const __styleMap = ${exp};
                const __styles = Object.entries(__styleMap).filter(([, v]) => Boolean(v)).map(([s]) => s).join('; ');
                ${append} __styles ? \` style="\${__styles}"\` : '';
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
                        
                        const loop = {
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

        this.register('lang', (exp, children, append) => `${append} _escape((_data.__t && _data.__t(${exp})) || ${exp});`);
        this.register('t', (exp, children, append) => `${append} _escape((_data.__t && _data.__t(${exp})) || ${exp});`);
        this.register('choice', (exp, children, append) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const key = args[0];
            const count = args[1] || '1';
            return `${append} _escape((_data.__choice && _data.__choice(${key}, ${count})) || ${key});`;
        });

        // Server Actions (@action)
        this.register('action', (exp, children, append) => {
            return `${append} '<input type="hidden" name="_action" value="' + ${exp} + '">';\n` +
                   `${append} '<input type="hidden" name="_action_sign" value="' + _engine.signAction(${exp}) + '">';`;
        });

        // Template Caching (@cache)
        this.register('cache', (exp, children) => {
            const args = exp?.split(',').map(a => a.trim()) || [];
            const key = args[0];
            const ttl = args[1] || '3600';
            
            return `{
                const __cacheKey = ${key};
                const __ttl = ${ttl};
                const __cached = await _engine.getCachedFragment(__cacheKey);
                if (__cached !== null) {
                    _output += __cached;
                } else {
                    const __prevOutput = _output;
                    _output = "";
                    ${children}
                    const __captured = _output;
                    _output = __prevOutput + __captured;
                    await _engine.setCachedFragment(__cacheKey, __captured, __ttl);
                }
            }`;
        });

    }
}
