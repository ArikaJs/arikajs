import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Validator, Rule, Required, Email, Min, Max } from '../src';

describe('Arika Validation', () => {
    it('validates required fields', async () => {
        const data = { name: '' };
        const rules = { name: 'required' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.deepStrictEqual(validator.errors(), {
            name: ['The name field is required.']
        });

        const validData = { name: 'Arika' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates email fields', async () => {
        const data = { email: 'invalid-email' };
        const rules = { email: 'email' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        assert.deepStrictEqual(validator.errors(), {
            email: ['The email must be a valid email address.']
        });

        const validData = { email: 'test@example.com' };
        const validValidator = new Validator(validData, rules);
        assert.strictEqual(await validValidator.fails(), false);
    });

    it('validates min rule', async () => {
        const data = { password: 'short', age: 10 };
        const rules = { password: 'min:8', age: 'min:18' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        const errors = validator.errors();
        assert.ok(errors.password);
        assert.ok(errors.age);
    });

    it('validates max rule', async () => {
        const data = { username: 'reallylongusername', score: 101 };
        const rules = { username: 'max:10', score: 'max:100' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        const errors = validator.errors();
        assert.ok(errors.username);
        assert.ok(errors.score);
    });

    it('validates string rule', async () => {
        const data = { name: 'Arika', age: 25 };
        const rules = { name: 'string', age: 'string' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        const errors = validator.errors();
        assert.ok(errors.age);
        assert.strictEqual(errors.age[0], 'The age must be a string.');
        assert.ok(!errors.name);
    });

    it('validates number rule', async () => {
        const data = { age: 25, name: 'Arika' };
        const rules = { age: 'number', name: 'number' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        const errors = validator.errors();
        assert.ok(errors.name);
        assert.strictEqual(errors.name[0], 'The name must be a number.');
        assert.ok(!errors.age);
    });

    it('supports custom rule classes', async () => {
        class Uppercase implements Rule {
            validate(value: any): boolean {
                return value === value.toUpperCase();
            }
            message(): string {
                return 'Must be uppercase';
            }
        }

        const data = { code: 'abc' };
        const validator = new Validator(data);
        validator.extend('uppercase', new Uppercase());

        // Directly test validate method as extension happens after constructor
        const rules = { code: 'uppercase' };
        const v = new Validator(data, rules);
        v.extend('uppercase', new Uppercase());

        assert.strictEqual(await v.fails(), true);
        assert.deepStrictEqual(v.errors(), {
            code: ['Must be uppercase']
        });
    });

    it('supports pipe syntax for multiple rules', async () => {
        const data = { email: 'invalid' };
        const rules = { email: 'required|email|min:10' };
        const validator = new Validator(data, rules);

        assert.strictEqual(await validator.fails(), true);
        const errors = validator.errors();
        // Should have at least one error (email format)
        assert.strictEqual(errors.email.includes('The email must be a valid email address.'), true);
    });
});
