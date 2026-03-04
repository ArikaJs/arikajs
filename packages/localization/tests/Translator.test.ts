import { Translator } from '../src/Translator';

describe('Translator Pluralization', () => {
    let translator: Translator;

    beforeEach(() => {
        translator = new Translator('en');
        translator.load('en', 'auth', {
            'apples': '{0} No apples|{1} One apple|[2,*] :count apples',
            'simple': 'Singular|Plural'
        });
    });

    test('it can choose zero form', () => {
        expect(translator.choice('auth.apples', 0)).toBe('No apples');
    });

    test('it can choose singular form', () => {
        expect(translator.choice('auth.apples', 1)).toBe('One apple');
    });

    test('it can choose plural form with range', () => {
        expect(translator.choice('auth.apples', 5)).toBe('5 apples');
        expect(translator.choice('auth.apples', 10)).toBe('10 apples');
    });

    test('it can choose simple singular/plural', () => {
        expect(translator.choice('auth.simple', 1)).toBe('Singular');
        expect(translator.choice('auth.simple', 2)).toBe('Plural');
    });

    test('it returns key if not found', () => {
        expect(translator.choice('auth.missing', 1)).toBe('auth.missing');
    });
});
