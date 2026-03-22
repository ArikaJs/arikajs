
import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { FormRequest } from '../src/FormRequest';

class TestRequest extends FormRequest {
    public authorize() {
        return Number(this.input('user_id')) === 1;
    }

    public rules() {
        return {
            title: 'required|string',
            age: 'required|number|min:18'
        };
    }
}

describe('FormRequest', () => {
    it('authorizes correctly', async () => {
        const app = {
            make: (key: string) => {
                if (key === 'validator') return { make: () => ({ fails: () => false, errors: () => ({ all: () => ({}) }) }) };
                return null;
            },
            config: () => ({ get: () => false })
        } as any;
        
        const req1 = new TestRequest(app, { url: '/?user_id=1', headers: {}, socket: {} } as any);
        assert.strictEqual(await req1.authorize(), true);

        const req2 = new TestRequest(app, { url: '/?user_id=2', headers: {}, socket: {} } as any);
        assert.strictEqual(await req2.authorize(), false);
    });

    it('passes validation when data is valid', async () => {
        const app = { 
            make: (key: any) => null,
            config: () => ({ get: () => false })
        } as any;
        
        const request = new TestRequest(app, { url: '/?user_id=1', headers: {}, socket: {} } as any);
        request.setBody({ title: 'Test', age: 20 });
        
        await request.validateForm();
        assert.deepStrictEqual(request.validated(), { title: 'Test', age: 20 });
    });

    it('throws validation error when data is invalid', async () => {
        const app = { 
            make: (key: any) => null,
            config: () => ({ get: () => false })
        } as any;
        
        const request = new TestRequest(app, { url: '/?user_id=1', headers: {}, socket: {} } as any);
        request.setBody({ age: 10 });

        try {
            await request.validateForm();
            assert.fail('Should have thrown validation error');
        } catch (e: any) {
            assert.ok(e.errors, 'Should have errors property');
        }
    });
});
