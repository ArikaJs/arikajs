import { test } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Application } from '../src/application/Application';
import { ServiceProvider } from '../src/providers/ServiceProvider';

test('Application: constructor accepts basePath', () => {
  const basePath = __dirname;
  const app = new Application(basePath);

  assert.strictEqual(app.getBasePath(), path.resolve(basePath));
});

test('Application: exposes container', () => {
  const app = new Application(__dirname);

  const container = app.getContainer();
  assert.ok(container);
});

test('Application: exposes config repository', () => {
  const app = new Application(__dirname);

  const config = app.config();
  assert.ok(config);
});

test('Application: can bind services', () => {
  const app = new Application(__dirname);

  app.bind('test', () => 'value');

  const value = app.resolve('test');
  assert.strictEqual(value, 'value');
});

test('Application: can register singleton', () => {
  const app = new Application(__dirname);
  let callCount = 0;

  app.singleton('counter', () => {
    callCount++;
    return callCount;
  });

  assert.strictEqual(app.resolve('counter'), 1);
  assert.strictEqual(app.resolve('counter'), 1);
  assert.strictEqual(callCount, 1);
});

test('Application: can register instance', () => {
  const app = new Application(__dirname);
  const instance = { id: 123 };

  app.instance('instance', instance);

  assert.strictEqual(app.resolve('instance'), instance);
});

test('Application: register() accepts ServiceProvider instance', async () => {
  const app = new Application(__dirname);
  let registered = false;
  let booted = false;

  class TestProvider extends ServiceProvider {
    register() {
      registered = true;
      this.app.instance('test', 'value');
    }

    boot() {
      booted = true;
    }
  }

  app.register(new TestProvider(app));
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.strictEqual(registered, true);
  assert.strictEqual(booted, true);
  assert.strictEqual(app.resolve('test'), 'value');
});

test('Application: register() accepts ServiceProvider class', async () => {
  const app = new Application(__dirname);
  let registered = false;

  class TestProvider extends ServiceProvider {
    register() {
      registered = true;
    }
  }

  app.register(TestProvider);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.strictEqual(registered, true);
});

test('Application: boot() runs all register() then all boot()', async () => {
  const app = new Application(__dirname);
  const order: string[] = [];

  class Provider1 extends ServiceProvider {
    register() {
      order.push('register1');
    }

    boot() {
      order.push('boot1');
    }
  }

  class Provider2 extends ServiceProvider {
    register() {
      order.push('register2');
    }

    boot() {
      order.push('boot2');
    }
  }

  app.register(Provider1);
  app.register(Provider2);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.deepStrictEqual(order, ['register1', 'register2', 'boot1', 'boot2']);
});

test('Application: boot() is idempotent', async () => {
  const app = new Application(__dirname);
  let bootCount = 0;

  class TestProvider extends ServiceProvider {
    register() { }
    boot() {
      bootCount++;
    }
  }

  app.register(TestProvider);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();
  await app.boot();
  await app.boot();

  assert.strictEqual(bootCount, 1);
  assert.strictEqual(app.isBooted(), true);
});

test('Application: cannot register providers after boot', async () => {
  const app = new Application(__dirname);

  class TestProvider extends ServiceProvider {
    register() { }
  }

  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.throws(() => {
    app.register(TestProvider);
  }, /Cannot register providers after the application has been booted/);
});

test('Application: run() calls boot() if not booted', async () => {
  const app = new Application(__dirname);
  let booted = false;

  class TestProvider extends ServiceProvider {
    register() { }
    boot() {
      booted = true;
    }
  }

  app.register(TestProvider);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.run();

  assert.strictEqual(booted, true);
  assert.strictEqual(app.isBooted(), true);
});

test('Application: config loads from config directory', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arika-test-'));
  const configDir = path.join(tmpDir, 'config');
  fs.mkdirSync(configDir, { recursive: true });

  // Create a test config file
  const configContent = `module.exports = {
  default: {
    name: 'Test App',
    version: '1.0.0'
  }
};`;
  fs.writeFileSync(path.join(configDir, 'app.js'), configContent);

  const app = new Application(tmpDir);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  const name = app.config().get('app.name');
  assert.strictEqual(name, 'Test App');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Application: config is read-only after boot', async () => {
  const app = new Application(__dirname);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.throws(() => {
    app.config().loadConfigDirectory(__dirname);
  }, /Configuration cannot be modified after boot/);
});
