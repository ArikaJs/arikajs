import { ServiceProvider } from '@arikajs/foundation';
import { Translator } from '@arikajs/localization';
import path from 'path';
import fs from 'fs';

export class TranslationServiceProvider extends ServiceProvider {
    /**
     * Register the translation service.
     */
    public register(): void {
        this.app.singleton(Translator, () => {
            const config = (this.app as any).config();
            const locale = config.get('app.locale', 'en');
            const fallbackLocale = config.get('app.fallback_locale', 'en');

            const translator = new Translator(locale, fallbackLocale);

            // Load translations from resources/lang
            this.loadTranslations(translator);

            return translator;
        });
    }

    /**
     * Load translations from the application's language directory.
     */
    private loadTranslations(translator: Translator): void {
        const langPath = path.join(process.cwd(), 'resources', 'lang');

        if (!fs.existsSync(langPath)) {
            return;
        }

        const locales = fs.readdirSync(langPath);

        for (const locale of locales) {
            const localePath = path.join(langPath, locale);
            if (!fs.statSync(localePath).isDirectory()) continue;

            const files = fs.readdirSync(localePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const group = path.basename(file, '.json');
                    const content = JSON.parse(fs.readFileSync(path.join(localePath, file), 'utf-8'));
                    translator.load(locale, group, content);
                }
            }
        }
    }
}
