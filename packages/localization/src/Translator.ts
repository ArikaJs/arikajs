import { TranslatorInterface } from './Contracts/Translator';
import { MessageSelector } from './MessageSelector';

export class Translator implements TranslatorInterface {
    private locale: string = 'en';
    private fallbackLocale: string = 'en';
    private translations: Record<string, any> = {};
    private selector: MessageSelector;

    constructor(locale: string = 'en', fallbackLocale: string = 'en') {
        this.locale = locale;
        this.fallbackLocale = fallbackLocale;
        this.selector = new MessageSelector();
    }

    /**
     * Get the translation for the given key.
     */
    public get(key: string, replace: Record<string, any> = {}, locale: string | null = null): string {
        const currentLocale = locale || this.locale;

        let line = this.getLine(currentLocale, key);

        // Fallback if not found
        if (!line && currentLocale !== this.fallbackLocale) {
            line = this.getLine(this.fallbackLocale, key);
        }

        if (!line) {
            return key;
        }

        return this.makeReplacements(line, replace);
    }

    /**
     * Get a translation according to an integer value.
     */
    public choice(key: string, number: number, replace: Record<string, any> = {}, locale: string | null = null): string {
        const line = this.get(key, replace, locale);

        // If the line is the key itself (not found), return it
        if (line === key) {
            return key;
        }

        const selected = this.selector.choose(line, number, locale || this.locale);

        return this.makeReplacements(selected, { ...replace, count: number });
    }

    /**
     * Set the current locale.
     */
    public setLocale(locale: string): void {
        this.locale = locale;
    }


    /**
     * Get the current locale.
     */
    public getLocale(): string {
        return this.locale;
    }

    /**
     * Load translations into the translator.
     */
    public load(locale: string, group: string, lines: Record<string, any>): void {
        if (!this.translations[locale]) {
            this.translations[locale] = {};
        }
        this.translations[locale][group] = lines;
    }

    /**
     * Retrieve a line from the translation repository.
     */
    private getLine(locale: string, key: string): string | null {
        const segments = key.split('.');
        const group = segments.shift();

        if (!group || !this.translations[locale] || !this.translations[locale][group]) {
            return null;
        }

        let line = this.translations[locale][group];
        for (const segment of segments) {
            if (line[segment] === undefined) {
                return null;
            }
            line = line[segment];
        }

        return typeof line === 'string' ? line : null;
    }

    /**
     * Make the place-holder replacements in the given line.
     */
    private makeReplacements(line: string, replace: Record<string, any>): string {
        if (Object.keys(replace).length === 0) {
            return line;
        }

        Object.entries(replace).forEach(([key, value]) => {
            line = line.replace(new RegExp(`:${key}`, 'g'), String(value));
        });

        return line;
    }
}
