
## Arika Config

`@arikajs/config` is a powerful, lightweight, and framework-agnostic configuration management library for Node.js.

It provides a unified way to manage environment variables and application configurations using fluent dot-notation access, type safety, schema validation, and automatic environment loading.

---

## ✨ Features

- **🎯 Dot-notation access**: Access nested configurations easily (e.g., `app.name`)
- **🚀 O(1) Config Caching**: Flat cache built on boot for maximum performance
- **🛡️ Schema Validation**: Validate config types, required fields, enums, and patterns before boot
- **🌍 Environment Integration**: Built-in `.env` file support with intelligent type casting
- **🔀 Environment Merging**: Auto-load `database.production.js` on top of `database.js`
- **📡 Change Listeners**: React to config changes in real-time during setup
- **🧊 Deep Freeze**: Immutable config after boot — no accidental mutations
- **🔑 Encrypted Values**: Auto-decrypt `enc:` prefixed secrets using `@arikajs/encryption`
- **🟦 TypeScript-first**: Full type safety and intellisense out of the box

---

## 📦 Installation

```bash
npm install @arikajs/config
```

---

## 🚀 Quick Start

### 1️⃣ Basic Usage

```ts
import { Repository } from '@arikajs/config';

const config = new Repository({
    app: {
        name: 'ArikaJS',
        env: 'production'
    },
    database: {
        connection: 'mysql',
        port: 3306
    }
});

// Access values using dot-notation
const appName = config.get('app.name'); // 'ArikaJS'
const dbPort = config.get('database.port', 5432); // 3306
```

### 2️⃣ Environment Variables

```ts
import { env } from '@arikajs/config';

// Automatically casts 'true'/'false' strings to booleans
const debug = env('APP_DEBUG', false); 

// Automatically casts 'null' string to null type
const key = env('APP_KEY');
```

---

## 🚀 O(1) Config Caching (Feature 1)

When `markAsBooted()` is called, the entire nested config tree is flattened into a `Map<string, any>`. All subsequent `get()` calls use this flat cache for **O(1)** lookup instead of traversing the object tree.

```ts
const config = new Repository({ app: { name: 'Arika' } });

// Pre-boot: walks nested objects (O(depth))
config.get('app.name');

config.markAsBooted();

// Post-boot: instant Map lookup (O(1))
config.get('app.name'); // ⚡ Blazing fast
```

This makes a measurable difference in high-traffic applications where `config.get()` is called thousands of times per second.

---

## 🛡️ Schema Validation (Feature 2)

Define a schema to validate your config before boot. If validation fails, the app crashes immediately with clear error messages — not deep inside a service.

```ts
config.defineSchema({
    'app.name': { type: 'string', required: true },
    'app.env': { 
        type: 'string', 
        enum: ['development', 'production', 'testing'] 
    },
    'app.key': { 
        type: 'string', 
        required: true, 
        min: 32,
        pattern: /^base64:[A-Za-z0-9+/=]+$/,
        message: 'APP_KEY must be a valid base64 string of at least 32 characters.'
    },
    'server.port': { type: 'number', min: 1, max: 65535 },
});

// This will throw if validation fails
config.markAsBooted();
```

### Supported Validation Rules

| Rule | Description |
| :--- | :--- |
| `type` | `'string'`, `'number'`, `'boolean'`, `'object'`, `'array'` |
| `required` | Fail if value is `undefined` or `null` |
| `enum` | Value must be one of the listed options |
| `min` / `max` | For numbers: value range. For strings: character length |
| `pattern` | RegExp that strings must match |
| `message` | Custom error message |
| `children` | Nested schema for objects |

---

## 🔀 Environment Merging (Feature 3)

Automatically load environment-specific config overrides without any manual `env()` calls.

```
config/
├── database.js          # Base config (loaded first)
├── database.production.js  # Production overrides (deep-merged on top)
├── database.testing.js     # Testing overrides
└── app.js
```

```ts
config.loadConfigDirectory('./config');
// If NODE_ENV=production:
//   1. Loads database.js
//   2. Deep-merges database.production.js on top
```

Supported environment suffixes: `.development.`, `.production.`, `.staging.`, `.testing.`, `.local.`

---

## 📡 Change Listeners (Feature 4)

React to config changes in real-time during the setup phase.

```ts
// Listen to a specific key
config.onChange('database.host', (key, newValue, oldValue) => {
    console.log(`Database host changed from ${oldValue} to ${newValue}`);
});

// Listen to any child of a parent key
config.onChange('database', (key, newValue, oldValue) => {
    console.log(`Database config changed: ${key}`);
});

// Listen to ALL changes globally
config.onAnyChange((key, newValue, oldValue) => {
    console.log(`Config changed: ${key} = ${newValue}`);
});
```

---

## 🧊 Deep Freeze (Feature 5)

After boot, the entire config tree is recursively frozen using `Object.freeze()`. Any accidental mutation will throw an error in strict mode.

```ts
config.markAsBooted();

const db = config.get('database');
db.host = 'hacked'; // ❌ TypeError: Cannot assign to read only property
```

This prevents subtle bugs where a service accidentally mutates shared config objects.

---

## 🔑 Encrypted Config Values (Feature 6)

Store sensitive values as encrypted strings prefixed with `enc:`. They are automatically decrypted when accessed via `get()`.

```ts
const config = new Repository({
    secrets: {
        api_key: 'enc:aGVsbG8td29ybGQ=',
        db_password: 'enc:c2VjcmV0LXBhc3N3b3Jk'
    }
});

// Set a decrypter (e.g., using @arikajs/encryption)
config.setDecrypter((encrypted) => {
    return Encrypter.decrypt(encrypted);
});

config.get('secrets.api_key'); // Returns decrypted value
```

This works both before and after boot, and integrates seamlessly with `@arikajs/encryption`.

---

## 📅 Advanced Usage

### Loading from a Directory
```ts
config.loadConfigDirectory(path.join(__dirname, 'config'));
```

### Global Helpers
```ts
import { config, env } from '@arikajs/config';

const timezone = config('app.timezone', 'UTC');
const debug = env('APP_DEBUG', false);
```

---

## 🏗 Architecture

```text
config/
├── src/
│   ├── EnvLoader.ts
│   ├── helpers.ts
│   ├── index.ts
│   └── Repository.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/config` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Configuration should be simple to define and impossible to break."
