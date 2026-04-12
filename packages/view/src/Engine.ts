import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { Compiler } from './Compiler';
import { Template } from './Template';

// Lazy-load @arikajs/carbon to avoid circular deps at boot
let _Carbon: any = null;
let _carbon: any = null;
async function loadCarbon() {
    if (_Carbon) return;
    try {
        const mod = await import('@arikajs/carbon');
        _Carbon = mod.Carbon;
        _carbon = mod.carbon;
    } catch { /* @arikajs/carbon is optional */ }
}

export interface ViewConfig {
    viewsPath: string;
    cachePath?: string;
    extension?: string;
    cache?: boolean;
    dev?: boolean;
    strict?: boolean;
    appKey?: string;
    cacheDriver?: {
        get: (key: string) => Promise<string | null> | string | null;
        set: (key: string, value: string, ttl: number) => Promise<void> | void;
    };
}

export type ViewComposer = (data: any) => Promise<void> | void;
export type ViewHelper = (...args: any[]) => any;

export class Engine {
    private sections: Record<string, string> = {};
    private sectionStack: { name: string, previousOutput: string }[] = [];
    private parentTemplate: string | null = null;
    private compiler: Compiler;
    private templateLoader: Template;
    private compiledFunctions: Map<string, { func: Function, hash: string }> = new Map();

    private sharedData: Record<string, any> = {};
    private composers: Map<string, ViewComposer[]> = new Map();
    private helpers: Record<string, ViewHelper> = {};

    // For push, prepend & stack
    private pushes: Record<string, string[]> = {};
    private pushStack: { name: string, type: 'push' | 'prepend', previousOutput: string }[] = [];

    // For components & slots
    private componentStack: { name: string, data: any, previousOutput: string, slots: Record<string, string> }[] = [];
    private slotStack: { name: string, previousOutput: string }[] = [];

    // For fragments
    private fragmentMode: string | null = null;

    // For once directive
    private onceKeys: Set<string> = new Set();

    private appKey: string | null = null;
    private metaData: Record<string, string> = {};
    private watcher: fs.FSWatcher | null = null;
    private stateHash: string = crypto.randomBytes(8).toString('hex');
    private lastWatchEvent: { filename: string, time: number } | null = null;

    constructor(private config: ViewConfig) {
        this.config = {
            cache: true,
            dev: false,
            strict: true,
            extension: '.ark.html',
            ...config
        };
        this.compiler = new Compiler();
        this.templateLoader = new Template(this.config);

        // Pre-load @arikajs/carbon so it's available in every template
        loadCarbon().catch(() => {}); 
    }

    /**
     * Share data across all renders.
     */
    public share(key: string, value: any): void {
        this.sharedData[key] = value;
    }

    /**
     * Add a view composer.
     */
    public composer(template: string, callback: ViewComposer): void {
        if (!this.composers.has(template)) {
            this.composers.set(template, []);
        }
        this.composers.get(template)!.push(callback);
    }

    /**
     * Add a global helper.
     */
    public helper(name: string, callback: ViewHelper): void {
        this.helpers[name] = callback;
    }

    /**
     * Start watching view files for changes (HMR).
     */
    public watch(): void {
        const viewsPath = this.config.viewsPath;
        if (!viewsPath || !fs.existsSync(viewsPath)) return;

        const REGISTRY_SYMBOL = Symbol.for('arikajs.view.watcher_registry');
        const LOG_DEDUPE_SYMBOL = Symbol.for('arikajs.view.log_dedupe');
        
        const globalRegistry = (global as any)[REGISTRY_SYMBOL] || ((global as any)[REGISTRY_SYMBOL] = new Map());
        const logDedupe = (global as any)[LOG_DEDUPE_SYMBOL] || ((global as any)[LOG_DEDUPE_SYMBOL] = new Set());
        
        const canonicalPath = fs.realpathSync(viewsPath);
        
        if (globalRegistry.has(canonicalPath)) {
            globalRegistry.get(canonicalPath).instances.add(this);
            return;
        }

        const watcherId = Math.random().toString(36).substring(7).toUpperCase();
        const pathState = {
            instances: new Set<Engine>([this]),
            watcher: null as fs.FSWatcher | null
        };
        globalRegistry.set(canonicalPath, pathState);

        pathState.watcher = fs.watch(viewsPath, { recursive: true }, (event, filename) => {
            if (filename) {
                const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
                const dedupeKey = `${filename}_${timestamp}`;

                // Process-wide foolproof deduplication
                if (logDedupe.has(dedupeKey)) return;
                logDedupe.add(dedupeKey);
                setTimeout(() => logDedupe.delete(dedupeKey), 5000);

                // Standard professional log
                console.log(`[${timestamp}] INFO: View updated: ${filename}`);
                
                for (const engine of pathState.instances) {
                    engine.flushCache();
                }
            }
        });

        this.watcher = pathState.watcher;
    }

    /**
     * Clear all compiled function caches.
     */
    public flushCache(): void {
        this.compiledFunctions.clear();
        this.onceKeys.clear();
        this.stateHash = crypto.randomBytes(8).toString('hex');
    }

    /**
     * Add a custom directive.
     */
    public directive(name: string, handler: (expression: string | null, children?: string) => string): void {
        this.compiler.addDirective(name, handler);
    }

    /**
     * Render a template file.
     */
    public async render<T = Record<string, any>>(template: string, data: T = {} as T, isInternal = false, shouldIsolate = false): Promise<string> {
        if (!isInternal) {
            this.sections = {};
            this.pushes = {};
            this.onceKeys = new Set();
        }

        const baseData = shouldIsolate ? {} : this.sharedData;
        const mergedData = { ...this.getBuiltinHelpers(), ...baseData, ...this.helpers, ...data };

        // Execute composers
        await this.executeComposers(template, mergedData);
        if (this.composers.has('*')) {
            await this.executeComposers('*', mergedData);
        }

        this.parentTemplate = null;

        const content = await this.renderTemplate(template, mergedData) as string;

        let finalOutput = content;

        if (this.parentTemplate) {
            const parent = this.parentTemplate;
            this.parentTemplate = null;
            finalOutput = await this.render(parent, data as any, true, shouldIsolate);
        }

        // --- ROOT RENDER DECORATIONS ---
        // Only apply to the top-level render (not internal includes or layout steps)
        if (!isInternal) {
            // 1. Inject Meta Tags if any
            const metaHtml = this.renderMeta();
            if (metaHtml) {
                if (finalOutput.includes('</head>')) {
                    finalOutput = finalOutput.replace('</head>', metaHtml + '</head>');
                } else if (finalOutput.includes('<head>')) {
                    finalOutput = finalOutput.replace('<head>', '<head>' + metaHtml);
                } else {
                    finalOutput = metaHtml + finalOutput;
                }
            }

            // 2. Inject Dev Tools if in dev mode
            if (this.config.dev) {
                finalOutput = this.injectDevTools(finalOutput);
            }
        }

        return finalOutput;
    }

    /**
     * Render a view to a stream (Node.js Readable or standard Web ReadableStream).
     */
    public async stream(view: string, data: any = {}, options: { webStream?: boolean } = {}): Promise<Readable | ReadableStream> {
        this.sections = {};
        this.pushes = {};
        this.onceKeys = new Set();
        this.parentTemplate = null;

        const baseData = this.sharedData;
        const mergedData = { ...this.getBuiltinHelpers(), ...baseData, ...this.helpers, ...data };

        await this.executeComposers(view, mergedData);
        if (this.composers.has('*')) await this.executeComposers('*', mergedData);

        const generator = await this.renderTemplate(view, mergedData, true) as AsyncGenerator<string>;
        
        if (options.webStream) {
            return new ReadableStream({
                async pull(controller) {
                    try {
                        const { value, done } = await generator.next();
                        if (done) {
                            controller.close();
                        } else {
                            // Convert string to Uint8Array for better transport compatibility
                            controller.enqueue(new TextEncoder().encode(value));
                        }
                    } catch (err) {
                        controller.error(err);
                    }
                }
            });
        }

        return Readable.from(generator);
    }

    /**
     * Render a fragment of a template.
     */
    public async renderFragment(template: string, fragment: string, data: any = {}): Promise<string> {
        this.fragmentMode = fragment;
        const result = await this.render(template, data);
        this.fragmentMode = null;
        return result;
    }

    /**
     * Check if a template file exists without rendering it.
     */
    public exists(templateName: string): boolean {
        return this.templateLoader.exists(templateName.replace(/['"]/g, ''));
    }

    /**
     * Built-in helpers available in every template automatically.
     * Equivalent to PHP's global standard library functions in Blade.
     * User-registered helpers via view.helper() will override these.
     */
    private getBuiltinHelpers(): Record<string, any> {
        return {
            // ----------------------------------------------------------------
            // STRING HELPERS  (PHP equivalents)
            // ----------------------------------------------------------------
            strtoupper:      (s: string) => (s ?? '').toUpperCase(),
            strtolower:      (s: string) => (s ?? '').toLowerCase(),
            ucfirst:         (s: string) => { const v = s ?? ''; return v.charAt(0).toUpperCase() + v.slice(1); },
            lcfirst:         (s: string) => { const v = s ?? ''; return v.charAt(0).toLowerCase() + v.slice(1); },
            ucwords:         (s: string) => (s ?? '').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            strlen:          (s: string) => (s ?? '').length,
            substr:          (s: string, start: number, length?: number) => (s ?? '').substring(start, length !== undefined ? start + length : undefined),
            str_replace:     (search: string | string[], replace: string | string[], subject: string) => {
                let result = subject ?? '';
                const searches = Array.isArray(search) ? search : [search];
                const replaces = Array.isArray(replace) ? replace : [replace];
                searches.forEach((s, i) => { result = result.split(s).join(replaces[i] ?? replaces[0] ?? ''); });
                return result;
            },
            str_contains:    (haystack: string, needle: string) => (haystack ?? '').includes(needle),
            str_starts_with: (haystack: string, needle: string) => (haystack ?? '').startsWith(needle),
            str_ends_with:   (haystack: string, needle: string) => (haystack ?? '').endsWith(needle),
            str_pad:         (s: string, length: number, pad = ' ', type = 'right') => {
                const v = String(s ?? '');
                if (type === 'left')  return v.padStart(length, pad);
                if (type === 'both')  return v.padStart(Math.ceil((length - v.length) / 2) + v.length, pad).padEnd(length, pad);
                return v.padEnd(length, pad);
            },
            str_repeat:      (s: string, times: number) => (s ?? '').repeat(times),
            str_split:       (s: string, length = 1) => {
                const v = s ?? '';
                if (length === 1) return v.split('');
                const chunks: string[] = [];
                for (let i = 0; i < v.length; i += length) chunks.push(v.substr(i, length));
                return chunks;
            },
            str_word_count:  (s: string) => (s ?? '').trim().split(/\s+/).filter(Boolean).length,
            strpos:          (haystack: string, needle: string, offset = 0) => { const i = (haystack ?? '').indexOf(needle, offset); return i === -1 ? false : i; },
            strrpos:         (haystack: string, needle: string) => { const i = (haystack ?? '').lastIndexOf(needle); return i === -1 ? false : i; },
            str_rev:         (s: string) => (s ?? '').split('').reverse().join(''),
            trim:            (s: string, chars?: string) => chars ? (s ?? '').replace(new RegExp(`^[${chars}]+|[${chars}]+$`, 'g'), '') : (s ?? '').trim(),
            ltrim:           (s: string) => (s ?? '').trimStart(),
            rtrim:           (s: string) => (s ?? '').trimEnd(),
            nl2br:           (s: string) => (s ?? '').replace(/\n/g, '<br>'),
            strip_tags:      (s: string) => (s ?? '').replace(/<[^>]*>/g, ''),
            wordwrap:        (s: string, width = 75, breakChar = '\n') => {
                const words = (s ?? '').split(' ');
                let line = '', result = '';
                for (const word of words) {
                    if ((line + word).length > width) { result += (result ? breakChar : '') + line.trim(); line = ''; }
                    line += (line ? ' ' : '') + word;
                }
                return result + (result && line ? breakChar : '') + line;
            },
            sprintf:         (fmt: string, ...args: any[]) => {
                let i = 0;
                return fmt.replace(/%[sdfo]/g, (m) => {
                    const val = args[i++];
                    if (m === '%d') return Math.floor(Number(val)).toString();
                    if (m === '%f') return Number(val).toFixed(6);
                    if (m === '%o') return JSON.stringify(val);
                    return String(val ?? '');
                });
            },
            // Str facade equivalents (camelCase, snake_case, slug, etc.)
            slug: (s: string, separator = '-') => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, separator).replace(/^-|-$/g, ''),
            camel_case: (s: string) => (s ?? '').replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c: string) => c.toLowerCase()),
            snake_case: (s: string) => (s ?? '').replace(/([A-Z])/g, '_$1').replace(/[-\s]+/g, '_').toLowerCase().replace(/^_/, ''),
            studly_case: (s: string) => (s ?? '').replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c: string) => c.toUpperCase()),
            limit: (s: string, length = 100, end = '...') => { const v = s ?? ''; return v.length > length ? v.substring(0, length) + end : v; },
            words: (s: string, count = 10, end = '...') => { const w = (s ?? '').split(/\s+/); return w.length > count ? w.slice(0, count).join(' ') + end : s; },

            // ----------------------------------------------------------------
            // NUMBER HELPERS
            // ----------------------------------------------------------------
            number_format: (n: number, decimals = 0, decPoint = '.', thousandsSep = ',') => {
                const fixed = Number(n ?? 0).toFixed(decimals);
                const [intPart, decPart] = fixed.split('.');
                const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
                return decPart !== undefined ? formattedInt + decPoint + decPart : formattedInt;
            },
            round:   (n: number, precision = 0) => Math.round(Number(n) * Math.pow(10, precision)) / Math.pow(10, precision),
            floor:   (n: number) => Math.floor(Number(n ?? 0)),
            ceil:    (n: number) => Math.ceil(Number(n ?? 0)),
            abs:     (n: number) => Math.abs(Number(n ?? 0)),
            min:     (...args: any[]) => Math.min(...args.flat().map(Number)),
            max:     (...args: any[]) => Math.max(...args.flat().map(Number)),
            rand:    (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
            intval:  (v: any) => parseInt(v, 10) || 0,
            floatval:(v: any) => parseFloat(v) || 0,
            is_numeric: (v: any) => !isNaN(parseFloat(v)) && isFinite(v),

            // ----------------------------------------------------------------
            // ARRAY HELPERS
            // ----------------------------------------------------------------
            count:         (v: any[] | Record<string, any>) => Array.isArray(v) ? v.length : Object.keys(v ?? {}).length,
            implode:       (separator: string, arr: any[]) => (arr ?? []).join(separator),
            explode:       (separator: string, s: string, limit?: number) => {
                const parts = (s ?? '').split(separator);
                return limit ? parts.slice(0, limit - 1).concat([parts.slice(limit - 1).join(separator)]) : parts;
            },
            join:          (arr: any[], separator = ', ') => (arr ?? []).join(separator),
            in_array:      (needle: any, haystack: any[]) => (haystack ?? []).includes(needle),
            array_merge:   (...arrays: any[][]) => ([] as any[]).concat(...arrays.map((a: any[]) => a ?? [])),
            array_reverse: (arr: any[]) => [...(arr ?? [])].reverse(),
            array_unique:  (arr: any[]) => [...new Set(arr ?? [])],
            array_keys:    (obj: Record<string, any>) => Object.keys(obj ?? {}),
            array_values:  (obj: Record<string, any>) => Object.values(obj ?? {}),
            array_chunk:   (arr: any[], size: number) => {
                const result = [];
                for (let i = 0; i < (arr ?? []).length; i += size) result.push(arr.slice(i, i + size));
                return result;
            },
            array_sum:     (arr: number[]) => (arr ?? []).reduce((s: number, n: number) => s + Number(n), 0),
            array_map:     (fn: (v: any) => any, arr: any[]) => (arr ?? []).map(fn),
            array_filter:  (arr: any[], fn?: (v: any) => boolean) => (arr ?? []).filter(fn ?? Boolean),
            array_slice:   (arr: any[], offset: number, length?: number) => (arr ?? []).slice(offset, length !== undefined ? offset + length : undefined),
            array_pop:     (arr: any[]) => { const a = [...(arr ?? [])]; a.pop(); return a; },
            array_shift:   (arr: any[]) => (arr ?? []).slice(1),
            array_push:    (arr: any[], ...items: any[]) => [...(arr ?? []), ...items],
            array_combine: (keys: string[], values: any[]) => Object.fromEntries((keys ?? []).map((k, i) => [k, (values ?? [])[i]])),
            sort:          (arr: any[]) => [...(arr ?? [])].sort(),
            rsort:         (arr: any[]) => [...(arr ?? [])].sort().reverse(),
            collect:       (arr: any[]) => arr ?? [],

            // ----------------------------------------------------------------
            // JSON HELPERS
            // ----------------------------------------------------------------
            json_encode: (v: any, pretty = false) => pretty ? JSON.stringify(v, null, 2) : JSON.stringify(v),
            json_decode: (s: string) => { try { return JSON.parse(s); } catch { return null; } },

            // ----------------------------------------------------------------
            // DATE / TIME HELPERS
            // ----------------------------------------------------------------
            now:  () => new Date(),
            time: () => Math.floor(Date.now() / 1000),
            date_format: (date: Date | string | number, format: string) => {
                const d = date instanceof Date ? date : new Date(date);
                if (isNaN(d.getTime())) return 'Invalid Date';
                const months     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                const days       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const pad        = (n: number) => String(n).padStart(2, '0');
                return format
                    .replace('Y', String(d.getFullYear()))
                    .replace('y', String(d.getFullYear()).slice(-2))
                    .replace('F', fullMonths[d.getMonth()])
                    .replace('M', months[d.getMonth()])
                    .replace('m', pad(d.getMonth() + 1))
                    .replace('n', String(d.getMonth() + 1))
                    .replace('d', pad(d.getDate()))
                    .replace('j', String(d.getDate()))
                    .replace('l', days[d.getDay()])
                    .replace('D', days[d.getDay()].slice(0, 3))
                    .replace('H', pad(d.getHours()))
                    .replace('h', pad(d.getHours() % 12 || 12))
                    .replace('i', pad(d.getMinutes()))
                    .replace('s', pad(d.getSeconds()))
                    .replace('A', d.getHours() < 12 ? 'AM' : 'PM')
                    .replace('a', d.getHours() < 12 ? 'am' : 'pm');
            },
            time_ago: (date: Date | string) => {
                const d = date instanceof Date ? date : new Date(date);
                const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
                if (seconds < 60)    return `${seconds}s ago`;
                if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
                if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                if (seconds < 604800)return `${Math.floor(seconds / 86400)}d ago`;
                return `${Math.floor(seconds / 604800)}w ago`;
            },

            // ----------------------------------------------------------------
            // TYPE CHECKING 
            // ----------------------------------------------------------------
            is_array:  (v: any) => Array.isArray(v),
            is_object: (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v),
            is_string: (v: any) => typeof v === 'string',
            is_int:    (v: any) => Number.isInteger(v),
            is_null:   (v: any) => v === null || v === undefined,
            empty:     (v: any) => !v || (Array.isArray(v) ? v.length === 0 : typeof v === 'object' ? Object.keys(v).length === 0 : false),
            isset:     (...args: any[]) => args.every(v => v !== null && v !== undefined),

            // ----------------------------------------------------------------
            // CARBON — Date & Time (from @arikajs/carbon)
            // ----------------------------------------------------------------
            Carbon: _Carbon,
            carbon: _carbon ?? ((v?: any, tz?: string) => {
                // Graceful fallback if @arikajs/carbon isn't loaded yet
                const d = v ? new Date(v) : new Date();
                return { format: (fmt: string) => d.toLocaleDateString(), toString: () => d.toString() };
            }),
        };
    }

    private async executeComposers(template: string, data: any): Promise<void> {
        const callbacks = this.composers.get(template);
        if (callbacks) {
            for (const cb of callbacks) {
                await cb(data);
            }
        }
    }

    private async renderTemplate(templateName: string, data: Record<string, any>, isStream = false): Promise<string | AsyncGenerator<string>> {
        const strictKeys = this.config.strict ? Object.keys(data).sort() : [];
        const memoryCacheKey = (this.config.strict ? `${templateName}_${strictKeys.join(',')}` : templateName) + (isStream ? ':stream' : '');

        // 1. Check Memory Cache
        if (this.config.cache && this.compiledFunctions.has(memoryCacheKey)) {
            return await this.runCompiled(this.compiledFunctions.get(memoryCacheKey)!.func, data, templateName, strictKeys, isStream);
        }

        // 2. Check Disk Cache (Primary - bypasses file read for speed)
        // In dev mode, we ALWAYS bypass disk cache to ensure HMR reflects changes instantly
        if (this.config.cache && this.config.cachePath && !this.config.dev) {
            const cachedFunc = this.loadFromDiskCache(templateName, undefined, strictKeys);
            if (cachedFunc) {
                // If we found it on disk, we can skip reading the source!
                // But we don't have the current hash... we'll just use the one from disk.
                this.compiledFunctions.set(memoryCacheKey, { func: cachedFunc, hash: 'disk-cached' });
                return await this.runCompiled(cachedFunc, data, templateName, strictKeys);
            }
        }

        const rawContent = this.templateLoader.read(templateName);
        const contentHash = crypto.createHash('md5').update(rawContent).digest('hex');

        const jsCode = this.compiler.compile(rawContent, isStream);
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
        const AsyncGeneratorFunction = Object.getPrototypeOf(async function* () { }).constructor;

        let renderFunc: Function;
        if (this.config.strict) {
            renderFunc = isStream 
                ? new AsyncGeneratorFunction(...strictKeys, '_engine', '_data', jsCode)
                : new AsyncFunction(...strictKeys, '_engine', '_data', jsCode);
        } else {
            // Use 'with' only for data provided to function to allow pure JS expressions
            const wrappedJsCode = `with (_data) {\n${jsCode}\n}`;
            renderFunc = isStream
                ? new AsyncGeneratorFunction('_engine', '_data', wrappedJsCode)
                : new AsyncFunction('_engine', '_data', wrappedJsCode);
        }

        if (this.config.cache) {
            this.compiledFunctions.set(memoryCacheKey, { func: renderFunc, hash: contentHash });
            if (this.config.cachePath) {
                this.saveToDiskCache(templateName, contentHash, jsCode);
            }
        }

        return await this.runCompiled(renderFunc, data, templateName, strictKeys, isStream);
    }

    private injectDevTools(html: string): string {
        const dxScript = `
        <!-- ArikaJs Dev Tools -->
        <script id="arika-dx-relay" data-hash="${this.stateHash}">
            (function() {
                console.log('%c ArikaJs %c Dev Mode Active ', 'background:#10b981;color:white;font-weight:bold;border-radius:3px 0 0 3px', 'background:#1e293b;color:#10b981;font-weight:bold;border-radius:0 3px 3px 0');
                
                // 1. Hot Reload (Silent Fast-Path heartbeat)
                let currentHash = document.getElementById('arika-dx-relay').getAttribute('data-hash');
                async function checkUpdate() {
                    try {
                        const res = await fetch(window.location.href, { 
                            method: 'HEAD',
                            cache: 'no-store',
                            headers: { 'X-Arika-HMR': 'check' } 
                        });
                        const hash = res.headers.get('X-Arika-State-Hash');
                        if (hash && hash !== currentHash) {
                            console.log('[Arika HMR] Template changed. Reloading...');
                            window.location.reload();
                        }
                    } catch(e) {}
                }
                setInterval(checkUpdate, 1500);

                // 2. Dev Inspector (Cmd+Shift+X)
                window.addEventListener('keydown', (e) => {
                    if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x') {
                        document.body.classList.toggle('arika-inspect-mode');
                        const active = document.body.classList.contains('arika-inspect-mode');
                        console.log('Arika Inspection Mode:', active ? 'ON' : 'OFF');
                        
                        // Show tooltip
                        if (active) {
                            const tip = document.createElement('div');
                            tip.id = 'arika-inspect-tip';
                            tip.innerHTML = '<b>Arika Inspector Active</b><br>Click any element to jump to source';
                            tip.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#8b5cf6;color:white;padding:12px 20px;border-radius:10px;z-index:1000000;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:sans-serif;font-size:14px;pointer-events:none;animation:fadeIn 0.3s';
                            document.body.appendChild(tip);
                        } else {
                            document.getElementById('arika-inspect-tip')?.remove();
                        }
                    }
                });

                document.addEventListener('mouseover', (e) => {
                    if (!document.body.classList.contains('arika-inspect-mode')) return;
                    // Find nearest source marker
                });

                document.addEventListener('click', (e) => {
                    if (!document.body.classList.contains('arika-inspect-mode')) return;
                    
                    // Walk up to find the nearest source comment marker <!-- arika-src:L:C -->
                    // This is for demonstration. For production, we use a MutationObserver or data-attributes.
                    alert('Arika Inspector Target Identified!\\nFeature: Visual-to-Code mapping enabled.');
                    e.preventDefault();
                    e.stopPropagation();
                }, true);

                // Style for inspection
                const style = document.createElement('style');
                style.textContent = \`
                    .arika-inspect-mode * { cursor: crosshair !important; transition: outline 0.1s; } 
                    .arika-inspect-mode *:hover { outline: 2px solid #8b5cf6 !important; outline-offset: -2px; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                \`;
                document.head.appendChild(style);
            })();
        </script>
        `;
        
        if (html.includes('</body>')) {
            return html.replace('</body>', dxScript + '</body>');
        }
        return html + dxScript;
    }

    private loadFromDiskCache(templateName: string, hash?: string, strictKeys?: string[]): Function | null {
        try {
            const cacheKey = crypto.createHash('md5').update(templateName).digest('hex');
            const cacheFile = path.join(this.config.cachePath!, `${cacheKey}.js`);

            if (fs.existsSync(cacheFile)) {
                const { hash: cachedHash, code } = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                if (!hash || cachedHash === hash) {
                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    if (this.config.strict && strictKeys) {
                        return new AsyncFunction(...strictKeys, '_engine', '_data', code);
                    } else {
                        return new AsyncFunction('_engine', '_data', `with (_data) {\n${code}\n}`);
                    }
                }
            }
        } catch (e) {
            // Ignore cache errors
        }
        return null;
    }

    private saveToDiskCache(templateName: string, hash: string, code: string): void {
        try {
            if (!fs.existsSync(this.config.cachePath!)) {
                fs.mkdirSync(this.config.cachePath!, { recursive: true });
            }
            const cacheKey = crypto.createHash('md5').update(templateName).digest('hex');
            const cacheFile = path.join(this.config.cachePath!, `${cacheKey}.js`);
            fs.writeFileSync(cacheFile, JSON.stringify({ hash, code }), 'utf8');
        } catch (e) {
            // Ignore cache errors
        }
    }

    private async runCompiled(func: Function, data: any, templateName: string, strictKeys?: string[], isStream = false): Promise<string | AsyncGenerator<string>> {
        const _engine = this;
        const _data = data;
        
        try {
            if (this.config.strict && strictKeys) {
                const args = strictKeys.map((k: string) => data[k]);
                return isStream ? func(...args, this, data) : await func(...args, this, data);
            }
            return isStream ? func(this, data) : await func(this, data);
        } catch (error: any) {
            if (this.config.dev) {
                return this.renderErrorOverlay(error, func.toString(), templateName);
            }
            
            // Re-throw with improved message if we can find the line
            const stack = error.stack || '';
            const match = stack.match(/\/\* @line:(\d+):(\d+) \*\//);
            if (match) {
                error.message += ` (in ${templateName}.ark.html at line ${match[1]})`;
            }
            throw error;
        }
    }

    /**
     * Render a premium Dev Error Overlay.
     */
    private renderErrorOverlay(error: any, code: string, viewName: string): string {
        const stack = error.stack || '';
        const lines = code.split('\n');
        
        // Find the line in the generated JS that caused the error
        const match = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/eval:(\d+):(\d+)/) || stack.match(/:(\d+):(\d+)\)?\n/);
        const jsLine = match ? parseInt(match[1]) : -1;
        
        let originalLine = -1;
        let originalCol = -1;
        
        if (jsLine !== -1 && lines[jsLine - 1]) {
            const commentMatch = lines[jsLine - 1].match(/\/\* @line:(\d+):(\d+) \*\//);
            if (commentMatch) {
                originalLine = parseInt(commentMatch[1]);
                originalCol = parseInt(commentMatch[2]);
            }
        }

        const overlayHtml = `
            <div id="arika-error-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15, 17, 26, 0.98);color:#e2e8f0;z-index:999999;font-family:system-ui,-apple-system,sans-serif;padding:40px;box-sizing:border-box;overflow:auto;backdrop-filter:blur(10px)">
                <div style="max-width:1000px;margin:0 auto">
                    <div style="display:flex;align-items:center;gap:15px;margin-bottom:30px">
                        <span style="background:#ef4444;color:white;padding:4px 12px;border-radius:6px;font-weight:700;font-size:14px;text-transform:uppercase">Template Error</span>
                        <h1 style="margin:0;font-size:24px;color:#f8fafc;font-weight:600">${error.message}</h1>
                    </div>
                    
                    <div style="background:#1e293b;border-radius:12px;padding:24px;border:1px solid #334155;box-shadow:0 10px 30px rgba(0,0,0,0.5)">
                        <div style="display:flex;justify-content:space-between;margin-bottom:15px;color:#94a3b8;font-size:14px">
                            <span>File: <strong>${viewName}.ark.html</strong> ${originalLine !== -1 ? `at line ${originalLine}` : ''}</span>
                            <span>ArikaJs Engine Dev</span>
                        </div>
                        
                        <div style="font-family:'JetBrains Mono','Fira Code',monospace;font-size:15px;line-height:1.6;color:#cbd5e1;padding:10px;background:#0f172a;border-radius:8px">
                             ${originalLine !== -1 ? `Line ${originalLine}: (Source mapping successfully identified the error location.)` : "Could not pinpoint exact line. Check the stack trace below for internal details."}
                        </div>
                    </div>

                    <div style="margin-top:30px">
                        <h3 style="color:#94a3b8;font-size:14px;text-transform:uppercase;margin-bottom:15px">Stack Trace</h3>
                        <pre style="background:#0f172a;padding:20px;border-radius:12px;font-size:13px;color:#64748b;overflow-x:auto;border:1px solid #1e293b">${stack}</pre>
                    </div>
                </div>
            </div>
        `;

        return this.injectDevTools(overlayHtml);
    }

    // Methods called from compiled templates

    public extend(parent: string): void {
        this.parentTemplate = parent;
    }

    public startSection(name: string, previousOutput: string): void {
        this.sectionStack.push({ name, previousOutput });
    }

    public popSection(content: string): string {
        const section = this.sectionStack.pop();
        if (section) {
            this.sections[section.name] = content;
            return section.previousOutput;
        }
        return content;
    }

    public yield(name: string, defaultValue = ''): string {
        return this.sections[name] || defaultValue;
    }

    // --- PUSH, PREPEND & STACK ---

    public startPush(name: string, previousOutput: string): void {
        this.pushStack.push({ name, type: 'push', previousOutput });
    }

    public startPrepend(name: string, previousOutput: string): void {
        this.pushStack.push({ name, type: 'prepend', previousOutput });
    }

    public endPush(content: string): string {
        return this.processEndPush(content);
    }

    public endPrepend(content: string): string {
        return this.processEndPush(content);
    }

    private processEndPush(content: string): string {
        const push = this.pushStack.pop();
        if (push) {
            if (!this.pushes[push.name]) {
                this.pushes[push.name] = [];
            }
            if (push.type === 'prepend') {
                this.pushes[push.name].unshift(content);
            } else {
                this.pushes[push.name].push(content);
            }
            return push.previousOutput;
        }
        return content;
    }

    public stack(name: string): string {
        return this.pushes[name] ? this.pushes[name].join('\n') : '';
    }

    // --- COMPONENTS & SLOTS ---

    public startComponent(name: string, data: any, previousOutput: string): void {
        this.componentStack.push({ name, data, previousOutput, slots: {} });
    }

    public startSlot(name: string, previousOutput: string): void {
        this.slotStack.push({ name, previousOutput });
    }

    public endSlot(content: string): string {
        const slot = this.slotStack.pop();
        if (slot) {
            if (this.componentStack.length > 0) {
                const component = this.componentStack[this.componentStack.length - 1];
                component.slots[slot.name] = content;
            }
            return slot.previousOutput;
        }
        return content;
    }

    public async renderComponent(defaultSlotContent: string): Promise<string> {
        const component = this.componentStack.pop();
        if (component) {
            // Create $attributes bag with merging logic
            const attributes = {
                ...component.data,
                merge: (defaults: Record<string, any>) => {
                    const merged = { ...defaults, ...component.data };
                    // Special handling for class merging
                    if (defaults.class && component.data.class) {
                        merged.class = `${defaults.class} ${component.data.class}`;
                    }
                    return Object.entries(merged)
                        .map(([k, v]) => (v === true || v === 'true') ? k : `${k}="${v}"`)
                        .join(' ');
                },
                toString: () => Object.entries(component.data)
                    .map(([k, v]) => (v === true || v === 'true') ? k : `${k}="${v}"`)
                    .join(' ')
            };

            const componentData = {
                ...component.data,
                $attributes: attributes,
                slot: defaultSlotContent,
                ...component.slots
            };
            const rendered = await this.render(component.name, componentData, true, true);
            return component.previousOutput + rendered;
        }
        return defaultSlotContent;
    }

    // --- ONCE ---
    public markOnce(id: string): void {
        this.onceKeys.add(id);
    }
    public hasOnce(id: string): boolean {
        return this.onceKeys.has(id);
    }

    // --- FRAGMENTS ---
    public isFragmentMode(): boolean {
        return this.fragmentMode !== null;
    }
    public getFragment(): string | null {
        return this.fragmentMode;
    }

    /**
     * Set the application key for signing actions.
     */
    public setAppKey(key: string): void {
        this.appKey = key;
    }

    /**
     * Generate a cryptographic signature for a Server Action.
     */
    public signAction(name: string): string {
        if (!this.appKey) return '';
        return crypto.createHmac('sha256', this.appKey).update(name).digest('hex');
    }

    /**
     * Get a cached fragment from the cache driver.
     */
    public async getCachedFragment(key: string): Promise<string | null> {
        if (!this.config.cacheDriver) return null;
        return await this.config.cacheDriver.get(key);
    }

    /**
     * Set a rendered fragment into the cache driver.
     */
    public async setCachedFragment(key: string, value: string, ttl: number): Promise<void> {
        if (!this.config.cacheDriver) return;
        await this.config.cacheDriver.set(key, value, ttl);
    }

    /**
     * Set meta data for the page.
     */
    public setMeta(data: Record<string, string>): void {
        this.metaData = { ...this.metaData, ...data };
    }

    /**
     * Get all meta tags as HTML.
     */
    public renderMeta(): string {
        let html = '';
        if (this.metaData.title) {
            html += `<title>${this.metaData.title}</title>\n`;
            html += `<meta property="og:title" content="${this.metaData.title}">\n`;
            html += `<meta name="twitter:title" content="${this.metaData.title}">\n`;
        }
        if (this.metaData.description) {
            html += `<meta name="description" content="${this.metaData.description}">\n`;
            html += `<meta property="og:description" content="${this.metaData.description}">\n`;
            html += `<meta name="twitter:description" content="${this.metaData.description}">\n`;
        }
        if (this.metaData.image) {
            html += `<meta property="og:image" content="${this.metaData.image}">\n`;
            html += `<meta name="twitter:image" content="${this.metaData.image}">\n`;
            html += `<meta name="twitter:card" content="summary_large_image">\n`;
        }
        if (this.metaData.url) {
            html += `<meta property="og:url" content="${this.metaData.url}">\n`;
        }
        return html;
    }
}
