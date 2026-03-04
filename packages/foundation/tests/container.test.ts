import { test } from 'node:test';
import assert from 'node:assert';
import { Container, Token } from '../src/container/Container';

test('Container: bind and resolve transient service', () => {
  const container = new Container();
  let callCount = 0;

  class Logger {
    constructor() {
      callCount++;
    }
  }

  container.bind(Logger, () => new Logger());

  const logger1 = container.resolve(Logger);
  const logger2 = container.resolve(Logger);

  assert.ok(logger1 instanceof Logger);
  assert.ok(logger2 instanceof Logger);
  assert.notStrictEqual(logger1, logger2);
  assert.strictEqual(callCount, 2);
});

test('Container: bind and resolve singleton', () => {
  const container = new Container();
  let callCount = 0;

  class Config {
    constructor() {
      callCount++;
    }
  }

  container.singleton(Config, () => new Config());

  const config1 = container.resolve(Config);
  const config2 = container.resolve(Config);

  assert.ok(config1 instanceof Config);
  assert.strictEqual(config1, config2);
  assert.strictEqual(callCount, 1);
});

test('Container: register instance', () => {
  const container = new Container();
  const instance = { name: 'test' };

  container.instance('test', instance);

  const resolved = container.resolve('test');
  assert.strictEqual(resolved, instance);
});

test('Container: resolve with string token', () => {
  const container = new Container();

  container.instance('app.name', 'My App');

  const name = container.resolve<string>('app.name');
  assert.strictEqual(name, 'My App');
});

test('Container: resolve with symbol token', () => {
  const container = new Container();
  const token = Symbol('logger');

  container.instance(token, { log: () => {} });

  const logger = container.resolve(token);
  assert.ok(logger);
});

test('Container: has() checks if token is registered', () => {
  const container = new Container();

  assert.strictEqual(container.has('missing'), false);

  container.instance('exists', 'value');
  assert.strictEqual(container.has('exists'), true);
});

test('Container: throws error when resolving unregistered token', () => {
  const container = new Container();

  assert.throws(() => {
    container.resolve('not.registered');
  }, /no binding found/);
});

test('Container: factory receives container for dependency resolution', () => {
  const container = new Container();

  container.instance('name', 'ArikaJS');

  class Service {
    constructor(public name: string) {}
  }

  container.bind(Service, (c: Container) => {
    const name = c.resolve<string>('name');
    return new Service(name);
  });

  const service = container.resolve(Service);
  assert.strictEqual(service.name, 'ArikaJS');
});

test('Container: make() and resolve() are aliases', () => {
  const container = new Container();

  container.instance('test', 'value');

  const viaMake = container.make('test');
  const viaResolve = container.resolve('test');

  assert.strictEqual(viaMake, viaResolve);
});
