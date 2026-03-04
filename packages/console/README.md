
## Arika Console

`@arikajs/console` provides the command system for the ArikaJS framework.

It allows packages and applications to define, register, and execute CLI commands with arguments, options, and dependency injection — forming the foundation for the `arika` command-line tool.

---

## ✨ Features

- **Command registration & discovery**: Effortlessly manage CLI commands
- **Lazy Loading**: High performance; commands are only loaded when executed
- **Signature-based definitions**: Intuitive signatures with default values `{name=default}`
- **Rich Output Components**: Tables, progress bars, and status indicators
- **Interactive Prompts**: Confirmations and question handling
- **Dependency injection**: Resolving commands via the service container
- **Extensible command lifecycle**: Hooks for pre/post execution
- **TypeScript-first design**: Typed arguments and options

---

## 📦 Installation

```bash
npm install @arikajs/console
# or
yarn add @arikajs/console
# or
pnpm add @arikajs/console
```

---

## 🚀 Defining a Command

```ts
import { Command } from '@arikajs/console';

export class QueueWorkCommand extends Command {
  signature = 'queue:work {--once}';
  description = 'Process queued jobs';

  async handle() {
    // command logic
    this.info('Processing queue...');
    
    if (this.option('once')) {
        this.comment('Running in single-work mode');
    }
  }
}
```

### 🧠 Command Signatures

`command:name {argument} {argument?} {argument=default} {--option} {--mode=val}`

| Type | Syntax | Description |
| :--- | :--- | :--- |
| **Required** | `{user}` | Command fails if missing |
| **Optional** | `{user?}` | Returns `null` if missing |
| **Default** | `{user=guest}` | Returns `"guest"` if missing |
| **Option** | `{--force}` | Boolean (true/false) |
| **Option Val** | `{--mode=}` | Expects a value |
| **Opt Default** | `{--mode=prod}` | Defaults to `"prod"` |

---

## 🎨 Rich Outputs & Interaction

### 📊 Tables
```ts
this.table(['Name', 'Email'], [
    ['Prakash', 'prakash@example.com'],
    ['Arika', 'arika@arikajs.com']
]);
```

### ⏳ Progress Bars
```ts
this.progressStart(100);
// ...
this.progressAdvance(10);
// ...
this.progressFinish();
```

### ⚡ Tasks
```ts
await this.task('Migrating database', async () => {
    await db.migrate();
});
```

### ❓ Interaction
```ts
if (await this.confirm('Do you want to proceed?')) {
    const name = await this.ask('What is your name?', 'Guest');
    this.success(`Hello ${name}`);
}
```

---

## 🚀 Performance: Lazy Registration

For large applications, register commands lazily to avoid loading classes until they are needed:

```ts
registry.registerLazy('make:controller {name}', 'Create a controller', () => import('./Commands/MakeController'));
```

---

## 🖥 Running Commands

Commands are executed through the CLI package (`@arikajs/cli`).
This package focuses only on command behavior, not binaries.

---

## 🔗 Integration

- **`@arikajs/queue`** → workers
- **`@arikajs/cache`** → cache commands
- **`@arikajs/events`** → event inspection
- **`@arikajs/logging`** → log tools

---

## 🏗 Architecture

```text
console/
├── src/
│   ├── Command.ts
│   ├── CommandRegistry.ts
│   ├── index.ts
│   ├── Input.ts
│   ├── Output.ts
│   └── Parser.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/console` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Powerful tools start with simple commands."
