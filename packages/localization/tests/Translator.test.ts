import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
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

    it('it can choose zero form', () => {
        assert.strictEqual(translator.choice('auth.apples', 0), 'No apples');
    });

    it('it can choose singular form', () => {
        assert.strictEqual(translator.choice('auth.apples', 1), 'One apple');
    });

    it('it can choose plural form with range', () => {
        assert.strictEqual(translator.choice('auth.apples', 5), '5 apples');
        assert.strictEqual(translator.choice('auth.apples', 10), '10 apples');
    });

    it('it can choose simple singular/plural', () => {
        assert.strictEqual(translator.choice('auth.simple', 1), 'Singular');
        assert.strictEqual(translator.choice('auth.simple', 2), 'Plural');
    });

    it('it returns key if not found', () => {
        assert.strictEqual(translator.choice('auth.missing', 1), 'auth.missing');
    });
});
