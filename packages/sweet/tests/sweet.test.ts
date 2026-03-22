import test from 'node:test';
import { strict as assert } from 'node:assert';
import { Sweet } from '../src/Sweet';

const setupMockDOM = () => {
    const mockElement = () => {
        const el = {
            className: '',
            style: {},
            classList: {
                add: () => {},
                remove: () => {}
            },
            appendChild: () => {},
            remove: () => {},
            querySelector: () => null,
            addEventListener: () => {},
            innerHTML: ''
        };
        return el;
    };

    (global as any).window = {};
    (global as any).document = {
        createElement: mockElement,
        querySelector: () => null,
        head: mockElement(),
        body: mockElement()
    };
};

test('Sweet Package', async (t) => {
    setupMockDOM();

    await t.test('Singleton behaviour', () => {
        const instance1 = Sweet.getInstance();
        const instance2 = Sweet.getInstance();
        assert.equal(instance1, instance2);
    });

    await t.test('Convenience methods exist', () => {
        const instance = Sweet.getInstance();
        assert.equal(typeof instance.success, 'function');
        assert.equal(typeof instance.error, 'function');
        assert.equal(typeof instance.warning, 'function');
        assert.equal(typeof instance.info, 'function');
        assert.equal(typeof instance.question, 'function');
        assert.equal(typeof instance.toast, 'function');
        assert.equal(typeof instance.promise, 'function');
        assert.equal(typeof instance.confirm, 'function');
    });
});
