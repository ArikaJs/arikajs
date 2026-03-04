
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { Encrypter } from '../src/Encrypter';

describe('Encrypter', () => {
    const key = 'base64:6uS6uS6uS6uS6uS6uS6uS6uS6uS6uS6uS6uS6uS6uS4='; // Exactly 32 bytes when decoded

    it('can encrypt and decrypt a string', () => {
        const encrypter = new Encrypter(key);
        const value = 'Hello World';
        const encrypted = encrypter.encrypt(value);

        assert.notStrictEqual(encrypted, value);
        assert.strictEqual(encrypter.decrypt(encrypted), value);
    });

    it('can encrypt and decrypt an object', () => {
        const encrypter = new Encrypter(key);
        const value = { id: 1, name: 'Arika' };
        const encrypted = encrypter.encrypt(value);

        assert.deepStrictEqual(encrypter.decrypt(encrypted), value);
    });

    it('throws exception when decrypting invalid payload', () => {
        const encrypter = new Encrypter(key);

        assert.throws(() => {
            encrypter.decrypt('invalid-base64');
        });

        assert.throws(() => {
            const invalidJson = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
            encrypter.decrypt(invalidJson);
        });
    });

    it('throws exception when authentication fails', () => {
        const encrypter = new Encrypter(key);
        const encrypted = encrypter.encrypt('secret');

        // Tamper with the payload
        const decoded = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf8'));
        decoded.value = Buffer.from('tampered').toString('base64');
        const tampered = Buffer.from(JSON.stringify(decoded)).toString('base64');

        assert.throws(() => {
            encrypter.decrypt(tampered);
        });
    });

    it('supports key rotation', () => {
        const oldKey = 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
        const newKey = key;

        const oldEncrypter = new Encrypter(oldKey);
        const newEncrypter = new Encrypter([newKey, oldKey]);

        const encryptedWithOld = oldEncrypter.encrypt('old secret');

        // New encrypter should be able to decrypt data from old key
        assert.strictEqual(newEncrypter.decrypt(encryptedWithOld), 'old secret');

        // But encryption should use the new key
        const encryptedWithNew = newEncrypter.encrypt('new secret');
        assert.throws(() => {
            oldEncrypter.decrypt(encryptedWithNew);
        });
    });

    it('can sign and verify payloads', () => {
        const encrypter = new Encrypter(key);
        const data = { foo: 'bar' };
        const signed = encrypter.sign(data);

        assert.deepStrictEqual(encrypter.verify(signed), data);
    });

    it('detects signature tampering', () => {
        const encrypter = new Encrypter(key);
        const signed = encrypter.sign('important');

        const decoded = JSON.parse(Buffer.from(signed, 'base64').toString('utf8'));
        decoded.value = JSON.stringify('tampered');
        const tampered = Buffer.from(JSON.stringify(decoded)).toString('base64');

        assert.throws(() => {
            encrypter.verify(tampered);
        });
    });

    it('allows key rotation for signatures', () => {
        const oldKey = 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
        const newKey = key;

        const oldEncrypter = new Encrypter(oldKey);
        const newEncrypter = new Encrypter([newKey, oldKey]);

        const signedWithOld = oldEncrypter.sign('old signature');
        assert.strictEqual(newEncrypter.verify(signedWithOld), 'old signature');
    });

    it('can encrypt and decrypt with compression', () => {
        const encrypter = new Encrypter(key);
        const largeValue = 'A'.repeat(1000);

        const encrypted = encrypter.encrypt(largeValue, { compress: true });
        const decrypted = encrypter.decrypt(encrypted);

        assert.strictEqual(decrypted, largeValue);
    });

    it('enforces TTL expiration', async () => {
        const encrypter = new Encrypter(key);

        // Use 1 for near-instant expiration
        const encrypted = encrypter.encrypt('timely', { ttl: 1 });

        assert.strictEqual(encrypter.decrypt(encrypted), 'timely');

        // Wait for it to expire
        await new Promise(resolve => setTimeout(resolve, 1100));

        assert.throws(() => {
            encrypter.decrypt(encrypted);
        }, /expired/);
    });

    it('supports contextual encryption (AAD)', () => {
        const encrypter = new Encrypter(key);
        const context = 'user-123';

        const encrypted = encrypter.encrypt('secret', { context });

        // Success with correct context
        assert.strictEqual(encrypter.decrypt(encrypted, { context }), 'secret');

        // Fails with wrong context
        assert.throws(() => {
            encrypter.decrypt(encrypted, { context: 'user-456' });
        });

        // Fails with no context
        assert.throws(() => {
            encrypter.decrypt(encrypted);
        });
    });
});
