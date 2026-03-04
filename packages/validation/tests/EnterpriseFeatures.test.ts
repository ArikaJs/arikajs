import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Validator } from '../src/Validator';

describe('Enterprise Validation Features', () => {

    it('supports custom error messages overriding general rules', async () => {
        const data = { email: '' };
        const rules = { email: 'required' };

        const validator = new Validator(data, rules, {
            'required': 'Hold up, you forgot the :attribute field!'
        });

        assert.strictEqual(await validator.fails(), true);
        assert.deepStrictEqual(validator.errors(), {
            email: ['Hold up, you forgot the email field!']
        });
    });

    it('supports custom error messages overriding specific field rules', async () => {
        const data = { email: 'invalid' };
        const rules = { email: 'email' };

        const validator = new Validator(data, rules, {
            'email.email': 'Dude, that is not a real email address!'
        });

        assert.strictEqual(await validator.fails(), true);
        assert.deepStrictEqual(validator.errors(), {
            email: ['Dude, that is not a real email address!']
        });
    });

    it('validates IN and NOT_IN rules', async () => {
        const data = { role: 'admin', status: 'banned' };
        const rules = { role: 'in:user,guest', status: 'not_in:banned,deleted' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.ok(validator.errors().role);
        assert.ok(validator.errors().status);

        const validData = { role: 'guest', status: 'active' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates Alpha and AlphaNum rules', async () => {
        const data = { name: 'Arika123', code: 'Code!' };
        const rules = { name: 'alpha', code: 'alpha_num' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.ok(validator.errors().name);
        assert.ok(validator.errors().code);

        const validData = { name: 'Arika', code: 'Code123' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates Boolean and Url rules', async () => {
        const data = { isActive: 'yes', website: 'not-a-url' };
        const rules = { isActive: 'boolean', website: 'url' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.ok(validator.errors().isActive);
        assert.ok(validator.errors().website);

        const validData = { isActive: true, website: 'https://arikajs.com' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates Array type', async () => {
        const data = { items: 'not-array' };
        const rules = { items: 'array' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.ok(validator.errors().items);

        const validData = { items: [1, 2, 3] };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates Confirmed fields', async () => {
        const data = { password: 'secret', password_confirmation: 'wrong' };
        const rules = { password: 'confirmed' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.ok(validator.errors().password);

        const validData = { password: 'secret', password_confirmation: 'secret' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });
});
