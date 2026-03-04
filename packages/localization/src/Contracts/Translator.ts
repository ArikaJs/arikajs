export interface TranslatorInterface {
    /**
     * Get the translation for the given key.
     */
    get(key: string, replace?: Record<string, any>, locale?: string | null): string;

    /**
     * Get a translation according to an integer value (pluralization).
     */
    choice(key: string, number: number, replace?: Record<string, any>, locale?: string | null): string;

    /**
     * Get the current locale.
     */
    getLocale(): string;

    /**
     * Set the current locale.
     */
    setLocale(locale: string): void;
}
