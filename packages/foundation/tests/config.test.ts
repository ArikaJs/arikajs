import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Repository } from '@arikajs/config';

test('Repository: get() returns undefined for missing key', () => {
  const repo = new Repository();

  assert.strictEqual(repo.get('missing'), undefined);
});

test('Repository: get() returns defaultValue for missing key', () => {
  const repo = new Repository();

  const value = repo.get('missing', 'default');
  assert.strictEqual(value, 'default');
});

test('Repository: get() supports dot notation', () => {
  const repo = new Repository();
  (repo as any).config = {
    app: {
      name: 'Test App',
      version: '1.0.0',
    },
  };

  assert.strictEqual(repo.get('app.name'), 'Test App');
  assert.strictEqual(repo.get('app.version'), '1.0.0');
});

test('Repository: has() checks if key exists', () => {
  const repo = new Repository();
  (repo as any).config = {
    app: {
      name: 'Test',
    },
  };

  assert.strictEqual(repo.has('app.name'), true);
  assert.strictEqual(repo.has('app.missing'), false);
});

test('Repository: all() returns all config', () => {
  const repo = new Repository();
  const config = {
    app: { name: 'Test' },
    db: { host: 'localhost' },
  };
  (repo as any).config = config;

  const all = repo.all();
  assert.deepStrictEqual(all, config);
  // Should be a copy, not the same reference
  assert.notStrictEqual(all, config);
});

test('Repository: loadConfigDirectory() loads JS files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arika-config-test-'));
  const configDir = path.join(tmpDir, 'config');
  fs.mkdirSync(configDir, { recursive: true });

  // Create test config files
  fs.writeFileSync(
    path.join(configDir, 'app.js'),
    `module.exports = { default: { name: 'Test App' } };`,
  );
  fs.writeFileSync(
    path.join(configDir, 'database.js'),
    `module.exports = { default: { host: 'localhost' } };`,
  );

  const repo = new Repository();
  repo.loadConfigDirectory(configDir);

  assert.strictEqual(repo.get('app.name'), 'Test App');
  assert.strictEqual(repo.get('database.host'), 'localhost');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Repository: loadConfigDirectory() handles missing directory', () => {
  const repo = new Repository();
  const missingDir = path.join(os.tmpdir(), 'non-existent-config');

  // Should not throw
  repo.loadConfigDirectory(missingDir);
});

test('Repository: markAsBooted() prevents further modifications', () => {
  const repo = new Repository();
  repo.markAsBooted();

  assert.throws(() => {
    repo.loadConfigDirectory(__dirname);
  }, /Configuration cannot be modified after boot/);
});

test('Repository: isBooted() returns boot status', () => {
  const repo = new Repository();

  assert.strictEqual(repo.isBooted(), false);
  repo.markAsBooted();
  assert.strictEqual(repo.isBooted(), true);
});
