
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Validator } from '../src';

describe('Advanced Validation Features', () => {

    it('handles nullable rule', async () => {
        const data = { email: null };
        const rules = { email: 'nullable|email' };

        const validator = new Validator(data, rules);
        const passed = await validator.validate();

        assert.strictEqual(passed, true);
        assert.deepStrictEqual(validator.validated(), { email: null });
    });

    it('handles bail rule', async () => {
        const data = { email: 'invalid-email' };
        const rules = { email: 'bail|email|min:10' };

        const validator = new Validator(data, rules);
        await validator.validate();

        const errors = validator.errors();
        // Should only have one error because of bail
        assert.strictEqual(errors.email.length, 1);
        assert.strictEqual(errors.email[0], 'The email must be a valid email address.');
    });

    it('validates nested objects with dot notation', async () => {
        const data = {
            user: {
                profile: {
                    age: 15
                }
            }
        };
        const rules = {
            'user.profile.age': 'number|min:18'
        };

        const validator = new Validator(data, rules);
        const passed = await validator.validate();

        assert.strictEqual(passed, false);
        assert.ok(validator.errors()['user.profile.age']);
    });

    it('validates arrays with wildcards', async () => {
        const data = {
            users: [
                { email: 'valid@example.com' },
                { email: 'invalid' }
            ]
        };
        const rules = {
            'users.*.email': 'required|email'
        };

        const validator = new Validator(data, rules);
        const passed = await validator.validate();

        assert.strictEqual(passed, false);
        assert.ok(validator.errors()['users.1.email']);
        assert.ok(!validator.errors()['users.0.email']);
    });

    it('handles conditional validation (required_if)', async () => {
        const data = {
            provider: 'email',
            password: ''
        };
        const rules = {
            password: 'required_if:provider,email|min:8'
        };

        const validator = new Validator(data, rules);
        const passed = await validator.validate();

        assert.strictEqual(passed, false);
        assert.ok(validator.errors().password);

        // Test fallback if condition not met
        const data2 = { provider: 'google', password: '' };
        const validator2 = new Validator(data2, rules);
        assert.strictEqual(await validator2.validate(), true);
    });

    it('returns only validated data with validated()', async () => {
        const data = {
            name: 'Prakash',
            email: 'prakash@example.com',
            extra: 'ignore me'
        };
        const rules = {
            name: 'required',
            email: 'required|email'
        };

        const validator = new Validator(data, rules);
        await validator.validate();

        const validated = validator.validated();
        assert.deepStrictEqual(validated, {
            name: 'Prakash',
            email: 'prakash@example.com'
        });
        assert.ok(!('extra' in validated));
    });
});
