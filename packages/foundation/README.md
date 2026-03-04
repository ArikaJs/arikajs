## Arika Foundation

`@arikajs/foundation` is the **engine block** of the ArikaJS ecosystem.

Before HTTP, routing, views, or CLI, this package defines the **core runtime model**:

- Application lifecycle
- Dependency Injection container
- Service provider system
- Configuration repository
- Kernel contracts (for HTTP / CLI / Queue to plug into later)

If the following works cleanly, the foundation is considered correct:

```ts
const app = new Application(basePath);

app.register(CoreServiceProvider);
app.boot();

app.run();
```

Arika Foundation is the cornerstone of ArikaJS: everything else in the framework sits on top of this.

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Application class (lifecycle + base path)
  - Service container (DI)
  - Service provider system
  - Configuration repository (read-only after boot)
  - Kernel contracts (interfaces only)
- **Out of scope (for this package)**:
  - HTTP server
  - Router
  - View engine
  - Auth, Queue, Mail
  - CLI command definitions

The goal of this package is to stay **small, focused, and stable**, forming the backbone for the broader ArikaJS framework.

---

## Features

- **Application core**
  - Central `Application` object as the runtime “heart”
  - Explicit lifecycle: `register()`, `boot()`, `run()`
  - Owns base path, container, and provider list

- **Dependency Injection Container**
  - Bind interfaces to concrete implementations
  - Singleton and transient bindings
  - Register existing instances
  - Resolve services by string token or class

- **Service Provider System**
  - Elegant `ServiceProvider` abstraction
  - `register()` for bindings
  - `boot()` for runtime logic
  - Deterministic order: all `register()` run before any `boot()`

- **Configuration Repository**
  - Loads config files from `/config`
  - Access values via `config('app.name')`-style lookup
  - Read-only after application boot

- **Kernel Contracts**
  - Interfaces only (no HTTP/CLI logic here)
  - Contracts that HTTP, CLI, and Queue kernels will implement

---

## Installation

```bash
npm install @arikajs/foundation
# or
yarn add @arikajs/foundation
# or
pnpm add @arikajs/foundation
```

This package is written in TypeScript and ships with type definitions.

---

## Quick Start

### 1. Create an application instance

```ts
import { Application } from '@arikajs/foundation';

const app = new Application(__dirname);
```

### 2. Register a core service provider

```ts
import { ServiceProvider } from '@arikajs/foundation';

class CoreServiceProvider extends ServiceProvider {
  register() {
    // Bind services here
    this.app.singleton('config.app.name', () => 'My Arika App');
  }

  boot() {
    // Runtime boot logic (optional)
  }
}

app.register(CoreServiceProvider);
```

### 3. Boot and run the application

```ts
await app.boot();
await app.run();
```

At this stage, `run()` is intentionally minimal. In higher layers (HTTP/CLI), `run()` will typically delegate to an appropriate kernel.

### 4. Register services in the container

```ts
// Bind a concrete value directly on the app
app.instance('config.app.name', 'My Arika App');

// Bind a class (transient by default)
class Logger {
  log(message: string) {
    console.log(`[app] ${message}`);
  }
}

app.bind(Logger, () => new Logger());

// Or bind with a string key
app.bind('logger', () => new Logger());
```

### 5. Resolve and use services

```ts
const logger = app.make<Logger>(Logger);
logger.log('Application started.');

const appName = app.make<string>('config.app.name');
logger.log(`Running: ${appName}`);
```

In a full ArikaJS application, higher-level packages (`@arikajs/http`, `@arikajs/router`, `@arikajs/view`, etc.) will use the same `Application` instance and container, usually via a shared `app` exported from a bootstrap file.

---

## Application

The `Application` class is the central object you create once and pass around (or export) as your app’s runtime.

Core responsibilities:

- Owns the **service container**
- Tracks the **base path** of the project
- Manages **service providers**
- Coordinates the **lifecycle**: `register()` → `boot()` → `run()`

Minimal API:

```ts
class Application {
  constructor(basePath: string);

  register(provider: ServiceProvider | (new (app: Application) => ServiceProvider)): void;
  boot(): Promise<void> | void;
  run(): Promise<void> | void;
}
```

Typical usage:

```ts
import { Application } from '@arikajs/foundation';
import { CoreServiceProvider } from './CoreServiceProvider';

const app = new Application(__dirname);

app.register(CoreServiceProvider);

await app.boot();
await app.run();
```

Later, your HTTP server, CLI commands, and queue workers will all receive this shared `app` instance.

---

## Service Container

The container is responsible for:

- Holding bindings between **keys** (string tokens or classes) and **factories**
- Caching singletons when requested
- Resolving dependencies on demand

Minimal API:

```ts
container.bind(key, factory);
container.singleton(key, factory);
container.instance(key, value);
container.resolve(key); // or app.make(key)
```

### Binding

```ts
// Bind a class
app.bind(Logger, () => new Logger());

// Bind by string key
app.bind('logger', () => new Logger());

// Bind singleton
app.singleton(Logger, () => new Logger());
app.singleton('config', () => loadConfig());
```

### Resolving

```ts
const logger = app.make<Logger>(Logger);
logger.log('Hello from Arika Foundation.');

const config = app.make<Config>('config');
```

### Instances

Use `instance` when you already have an object and just want to register it:

```ts
const cache = new InMemoryCache();
app.instance('cache', cache);
```

---

## Service Providers

Service providers are the primary way to package and register features.

Base class:

```ts
abstract class ServiceProvider {
  constructor(protected readonly app: Application) {}

  abstract register(): void | Promise<void>;

  boot(): void | Promise<void> {
    // optional to override
  }
}
```

Rules:

- `register()`:
  - Bind services to the container.
  - No heavy runtime side-effects.
- `boot()`:
  - Perform runtime logic after all providers are registered.
  - Safe to resolve other services.

Registration order:

- All providers’ `register()` methods run first.
- Then all providers’ `boot()` methods run.

Usage:

```ts
class CoreServiceProvider extends ServiceProvider {
  register() {
    this.app.singleton('logger', () => new Logger());
  }

  boot() {
    const logger = this.app.make<Logger>('logger');
    logger.log('Core services booted.');
  }
}

app.register(CoreServiceProvider);
await app.boot();
```

---

## Configuration

Configuration is accessed via a lightweight repository that:

- Loads plain objects from files in `/config`
- Exposes them through a simple `get` API (or helper)
- Is read-only after application boot

Conceptually:

```ts
const name = app.config().get('app.name');
// or
const name = config('app.name');
```

Implementation details (for this package):

- A `Repository` class (e.g. `config/Repository.ts`) that stores nested config.
- Loading happens during application bootstrap, based on the `basePath` passed to `Application`.

Example `config/app.ts`:

```ts
import { env } from '@arikajs/foundation';

export default {
  name: env('APP_NAME', 'My Arika App'),
  env: env('APP_ENV', 'development'),
};
```

Then:

```ts
const appName = app.config().get('app.name');
```

---

## Environment Variables

Arika Foundation provides a lightweight environment variable loader and helper, with a fluent API.

If a `.env` file exists at the application base path, it will be automatically loaded during application bootstrap.

**Example `.env`:**

```env
APP_NAME="My Arika App"
APP_ENV=development
APP_DEBUG=true
```

Values are injected into `process.env` and are available throughout the application lifecycle.

### `env()` Helper

Use the `env()` helper to safely access environment variables:

```ts
import { env } from '@arikajs/foundation';

const appEnv = env('APP_ENV', 'production');
```

**Rules:**
- Reads from `process.env`
- Supports default values
- Does not mutate environment variables

### Using Environment Variables in Config

Config files can reference environment variables directly:

```ts
// config/app.ts
import { env } from '@arikajs/foundation';

export default {
  name: env('APP_NAME', 'Arika App'),
  env: env('APP_ENV', 'development'),
  url: env('APP_URL', 'http://localhost:3000'),
  timezone: env('APP_TIMEZONE', 'UTC'),
};
```

Configuration is resolved during application bootstrap and becomes read-only after boot.

> **Important philosophy:**
> Arika Foundation loads environment variables but does not create `.env` files.
> Project scaffolding and `.env` generation are responsibilities of `@arikajs/cli`.
> This distinction is key to keeping the foundation package lightweight.

---

## Environment Loading & Runtime Configuration

Arika Foundation provides automatic `.env` loading and runtime configuration management during application bootstrap.

### .env Loader

The foundation package uses `dotenv` to automatically load environment variables from a `.env` file at the application's base path.

**When it loads:**
- During application bootstrap (before service providers register)
- Automatically searches for `.env` in the base path
- Uses `dotenv.config({ path: basePath + '/.env' })`

**Example `.env`:**
```env
APP_NAME="My Arika App"
APP_ENV=development
APP_URL=http://localhost:3000
APP_TIMEZONE=Asia/Kolkata
APP_DEBUG=true
```

### Config Repository

The configuration repository loads config files from the `/config` directory and provides a simple API to access nested values.

**Loading config files:**
```ts
// config/app.ts
import { env } from '@arikajs/foundation';

export default {
  name: env('APP_NAME', 'Arika App'),
  env: env('APP_ENV', 'development'),
  url: env('APP_URL', 'http://localhost:3000'),
  timezone: env('APP_TIMEZONE', 'UTC'),
  debug: env('APP_DEBUG', false),
};
```

**Accessing config values:**
```ts
import { config } from '@arikajs/foundation';

// Using the config() helper
const appName = config('app.name');
const appUrl = config('app.url');
const timezone = config('app.timezone');

// With default values
const debugMode = config('app.debug', false);
```

**Dot notation support:**
- `config('app.name')` → reads `config/app.ts` → returns `name` property
- `config('database.connections.mysql.host')` → deep nested access
- `config('cache.default')` → reads from `config/cache.ts`

### Timezone Runtime Application

The foundation automatically applies the timezone from configuration to the Node.js process during the boot phase.

**How it works:**
1. Config is loaded from `config/app.ts`
2. During boot, the timezone is read: `config('app.timezone')`
3. Applied to the process: `process.env.TZ = config('app.timezone')`
4. All subsequent `Date` operations use this timezone

**Example:**
```ts
// config/app.ts
export default {
  timezone: env('APP_TIMEZONE', 'UTC'),
};

// After boot, all dates use the configured timezone
const now = new Date();
console.log(now.toString()); // Uses Asia/Kolkata if configured
```

**Where this happens:**
- In the `Application.boot()` method or
- In a core `AppServiceProvider.boot()` method

### config() Helper

The `config()` helper is a global function exported from the foundation package for easy access to configuration values.

**Signature:**
```ts
function config(key: string, defaultValue?: any): any;
```

**Usage examples:**
```ts
import { config } from '@arikajs/foundation';

// Simple access
const appName = config('app.name');

// With default value
const cacheDriver = config('cache.driver', 'memory');

// Nested access
const dbHost = config('database.connections.mysql.host');

// In service providers
class MyServiceProvider extends ServiceProvider {
  boot() {
    const url = config('app.url');
    console.log(`App running at: ${url}`);
  }
}
```

**Bootstrap flow:**
1. `.env` file loaded → `process.env` populated
2. Config files loaded → `env()` helper reads from `process.env`
3. Config repository initialized → values cached
4. Timezone applied → `process.env.TZ` set
5. Application booted → `config()` helper ready to use

---

## Kernel Contracts

Foundation defines contracts for kernels, but does **not** implement HTTP, CLI, or Queue logic itself.

Example:

```ts
export interface Kernel {
  bootstrap(): Promise<void> | void;
  handle(...args: any[]): Promise<any> | any;
}
```

Higher-level packages (e.g. `@arikajs/http`, `@arikajs/cli`) will implement these interfaces and plug into the `Application` lifecycle.

---
## 🏗 Architecture

```text
foundation/
├── src/
│   ├── application
│   │   └── Application.ts
│   ├── container
│   │   └── Container.ts
│   ├── contracts
│   │   ├── Application.ts
│   │   └── Kernel.ts
│   ├── providers
│   │   └── ServiceProvider.ts
│   ├── support
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

Your ArikaJS apps that consume this package will typically have:

- `app/` for application code
- `bootstrap/` for creating and configuring the `Application` instance

---

## Versioning & Stability

- While in **v0.x**, the API may change between minor versions.
- Once the container + application APIs stabilize, `@arikajs/foundation` will move to **v1.0** and follow **semver** strictly.

Because all other ArikaJS packages depend on this foundation, we aim to keep it:

- **Small**
- **Predictable**
- **Backward compatible** (post v1.0)

---

## Contributing

Contributions are welcome, especially around:

- Container ergonomics
- Clear, framework-level contracts
- Test coverage and type safety

Before submitting a PR:

- Run the test suite
- Add tests for any new behavior
- Keep the public API minimal and well-documented

---

## License

`@arikajs/foundation` is open-sourced software licensed under the **MIT license**.