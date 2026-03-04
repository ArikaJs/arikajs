import { test } from 'node:test';
import assert from 'node:assert';
import { Application } from '../src/application/Application';
import { ServiceProvider } from '../src/providers/ServiceProvider';

test('ServiceProvider: register() is called during boot', async () => {
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

test('ServiceProvider: boot() is optional', async () => {
  const app = new Application(__dirname);

  class TestProvider extends ServiceProvider {
    register() {
      // No boot() override
    }
  }

  app.register(TestProvider);

  // Should not throw
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();
});

test('ServiceProvider: boot() can access other services', async () => {
  const app = new Application(__dirname);
  let serviceResolved = false;

  class ServiceProvider1 extends ServiceProvider {
    register() {
      this.app.instance('service', { name: 'test' });
    }
  }

  class ServiceProvider2 extends ServiceProvider {
    register() {
      // Register after Provider1
    }

    async boot() {
      const service = this.app.resolve('service');
      serviceResolved = !!service;
    }
  }

  app.register(ServiceProvider1);
  app.register(ServiceProvider2);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.strictEqual(serviceResolved, true);
});

test('ServiceProvider: register() can be async', async () => {
  const app = new Application(__dirname);
  let registered = false;

  class TestProvider extends ServiceProvider {
    async register() {
      await new Promise((resolve) => setTimeout(resolve, 10));
      registered = true;
    }
  }

  app.register(TestProvider);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.strictEqual(registered, true);
});

test('ServiceProvider: boot() can be async', async () => {
  const app = new Application(__dirname);
  let booted = false;

  class TestProvider extends ServiceProvider {
    register() { }

    async boot() {
      await new Promise((resolve) => setTimeout(resolve, 10));
      booted = true;
    }
  }

  app.register(TestProvider);
  app.config().set('app.key', 'base64:sm957Y1wUYo8Uj8yL1fD7vX+X6y8gG+E6XpXnJz+I=');
  await app.boot();

  assert.strictEqual(booted, true);
});
