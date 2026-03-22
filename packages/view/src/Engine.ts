import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
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

    constructor(private config: ViewConfig) {
        this.config = {
            cache: true,
            dev: false,
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

        const content = await this.renderTemplate(template, mergedData);

        if (this.parentTemplate) {
            const parent = this.parentTemplate;
            this.parentTemplate = null;
            return this.render(parent, data as any, true, shouldIsolate);
        }

        return content;
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

    private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
        // 1. Check Memory Cache
        if (this.config.cache && this.compiledFunctions.has(templateName)) {
            return await this.runCompiled(this.compiledFunctions.get(templateName)!.func, data, templateName);
        }

        // 2. Check Disk Cache (Primary - bypasses file read for speed)
        if (this.config.cache && this.config.cachePath) {
            const cachedFunc = this.loadFromDiskCache(templateName);
            if (cachedFunc) {
                // If we found it on disk, we can skip reading the source!
                // But we don't have the current hash... we'll just use the one from disk.
                this.compiledFunctions.set(templateName, { func: cachedFunc, hash: 'disk-cached' });
                return await this.runCompiled(cachedFunc, data, templateName);
            }
        }

        const rawContent = this.templateLoader.read(templateName);
        const contentHash = crypto.createHash('md5').update(rawContent).digest('hex');

        const jsCode = this.compiler.compile(rawContent);
        const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

        // Use 'with' only for data provided to function to allow pure JS expressions
        const wrappedJsCode = `with (_data) {\n${jsCode}\n}`;
        const renderFunc = new AsyncFunction('_engine', '_data', wrappedJsCode);

        if (this.config.cache) {
            this.compiledFunctions.set(templateName, { func: renderFunc, hash: contentHash });
            if (this.config.cachePath) {
                this.saveToDiskCache(templateName, contentHash, jsCode);
            }
        }

        return await this.runCompiled(renderFunc, data, templateName);
    }

    private loadFromDiskCache(templateName: string, hash?: string): Function | null {
        try {
            const cacheKey = crypto.createHash('md5').update(templateName).digest('hex');
            const cacheFile = path.join(this.config.cachePath!, `${cacheKey}.js`);

            if (fs.existsSync(cacheFile)) {
                const { hash: cachedHash, code } = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                if (!hash || cachedHash === hash) {
                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    return new AsyncFunction('_engine', '_data', `with (_data) {\n${code}\n}`);
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

    private async runCompiled(func: Function, data: any, templateName: string): Promise<string> {
        try {
            return await func(this, data);
        } catch (e: any) {
            if (this.config.dev) {
                // In dev mode, we could enhance the error further
                throw new Error(`Error in ${templateName}: ${e.message}\nStack: ${e.stack}`);
            }
            throw new Error(`Error rendering template "${templateName}": ${e.message}`);
        }
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
            const componentData = {
                ...component.data,
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
}
