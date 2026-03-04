import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { EnvLoader, env } from '@arikajs/config';
import { Application } from '../src/application/Application';

test('env(): returns value from process.env', () => {
    process.env.TEST_VAR = 'hello';
    assert.strictEqual(env('TEST_VAR'), 'hello');
    delete process.env.TEST_VAR;
});

test('env(): returns default value if not set', () => {
    assert.strictEqual(env('NON_EXISTENT', 'default'), 'default');
});

test('env(): casts boolean strings', () => {
    process.env.TEST_TRUE = 'true';
    process.env.TEST_FALSE = 'false';

    assert.strictEqual(env('TEST_TRUE'), true);
    assert.strictEqual(env('TEST_FALSE'), false);

    delete process.env.TEST_TRUE;
    delete process.env.TEST_FALSE;
});

test('env(): casts null and empty strings', () => {
    process.env.TEST_NULL = 'null';
    process.env.TEST_EMPTY = '(empty)';

    assert.strictEqual(env('TEST_NULL'), null);
    assert.strictEqual(env('TEST_EMPTY'), '');

    delete process.env.TEST_NULL;
    delete process.env.TEST_EMPTY;
});

test('EnvLoader: loads .env file into process.env', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arika-env-test-'));
    const envContent = `
APP_NAME="Arika Test"
APP_ENV=testing
# Comment line
APP_DEBUG=true
QUOTED_VAL='single-quoted'
  `;
    fs.writeFileSync(path.join(tmpDir, '.env'), envContent);

    EnvLoader.load(tmpDir);

    assert.strictEqual(process.env.APP_NAME, 'Arika Test');
    assert.strictEqual(process.env.APP_ENV, 'testing');
    assert.strictEqual(process.env.APP_DEBUG, 'true');
    assert.strictEqual(process.env.QUOTED_VAL, 'single-quoted');

    // Cleanup
    delete process.env.APP_NAME;
    delete process.env.APP_ENV;
    delete process.env.APP_DEBUG;
    delete process.env.QUOTED_VAL;
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Application: automatically loads .env from base path', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arika-app-env-test-'));
    fs.writeFileSync(path.join(tmpDir, '.env'), 'APP_ENV=auto-loaded');

    new Application(tmpDir);

    assert.strictEqual(env('APP_ENV'), 'auto-loaded');

    // Cleanup
    delete process.env.APP_ENV;
    fs.rmSync(tmpDir, { recursive: true, force: true });
});
