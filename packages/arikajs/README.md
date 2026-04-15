# ArikaJS

<div align="center">

<img src="../cli/templates/app/public/assets/img/logo.png" alt="ArikaJS Logo" width="400">

**A Modern, Elegant Web Framework for Node.js**

[![npm version](https://img.shields.io/npm/v/arikajs.svg?style=flat-square)](https://www.npmjs.com/package/arikajs)
[![npm downloads](https://img.shields.io/npm/dm/arikajs.svg?style=flat-square)](https://www.npmjs.com/package/arikajs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](../../LICENSE)
[![Discord](https://img.shields.io/badge/discord-join-7289da?style=flat&logo=discord&logoColor=white)](https://discord.gg/XUTjzwjrHK)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=flat-square)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/arikajs/arikajs.svg?style=flat-square)](https://github.com/arikajs/arikajs/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/arikajs/arikajs.svg?style=flat-square)](https://github.com/arikajs/arikajs/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/arikajs/arikajs/pulls)

[Quick Start](#quick-start) | [Core Modules](#-the-arikajs-ecosystem) | [Documentation](https://github.com/arikajs/arikajs#readme) | [Discord](https://discord.gg/XUTjzwjrHK)

</div>

---

## 🚀 What is ArikaJS?

ArikaJS is a **modern, elegant, and powerful** full-stack framework for Node.js. It is designed to provide an unparalleled developer experience by bringing enterprise-grade architecture patterns (inspired by Laravel and NestJS) into a native, high-performance TypeScript environment.

Whether you're building a simple REST API or a complex enterprise monolith, ArikaJS provides the tools you need—from a powerful ORM and background queues to expressive routing and real-time event broadcasting.

---

## ✨ Key Features

- 🎯 **Elegant Syntax** - Expressive, readable code that minimizes boilerplate.
- 🔥 **TypeScript First** - Deeply integrated type safety with zero-config setup.
- 🏛️ **Modular Monorepo** - Built as a collection of decoupled, high-quality packages.
- 🗄️ **Active Record ORM** - An intuitive, Fluent interface for database interactions.
- 💉 **IoC & Dependency Injection** - Powerful service container for decoupled architecture.
- 🔐 **Auth & Authorization** - Guards, Policies, and multi-provider authentication.
- 🔄 **Queue & Scheduler** - Background jobs and Cron-like task scheduling.
- 🌍 **Localization (i18n)** - Built-in support for multi-language applications.
- 📅 **Carbon Date API** - Elegant date and time manipulation.
- 🎨 **Templating** - Lightning-fast Arika View engine with layout support.
- 🧪 **First-Class Testing** - Built-in testing helpers and assertions.

---

## 📦 The ArikaJS Ecosystem

ArikaJS is composed of specialized modules that can be used together or independently.

| Package | Purpose |
| :--- | :--- |
| **`arikajs`** | The core framework wrapper and "glue" |
| **`@arikajs/cli`** | Scaffolding, migrations, and local development |
| **`@arikajs/database`** | Database layer, Schema builder, and ORM |
| **`@arikajs/auth`** | Authentication (Web Session, JWT, API tokens) |
| **`@arikajs/queue`** | Redis/Database/Sync background job processing |
| **`@arikajs/scheduler`** | Fluid task scheduling for your application |
| **`@arikajs/carbon`** | Powerful, fluent date manipulation (Carbon JS) |
| **`@arikajs/view`** | Expressive template engine (Blade-inspired) |
| **`@arikajs/cache`** | High-performance multi-driver caching |
| **`@arikajs/mail`** | Fluent email API with SMTP, Log, and SES support |
| **`@arikajs/events`** | Event-driven architecture with listeners |
| **`@arikajs/validation`** | Powerful, schema-based request validation |

---

## 🚦 Quick Start

Create your first ArikaJS project in seconds:

```bash
# Scaffold a new application
npx @arikajs/cli@latest new my-app

# Navigate into the project
cd my-app

# Install dependencies and start development
npm install && arika serve --dev
```

---

## 📖 Basic Examples

### Expressive Routing
```typescript
import { Route } from 'arikajs';

Route.get('/', () => 'Hello World');

Route.group({ prefix: 'api', middleware: 'auth' }, () => {
    Route.get('/profile', [ProfileController, 'show']);
});
```

### Powerful ORM (Active Record)
```typescript
const user = await User.where('email', 'prakash@example.com').first();

const posts = await user.posts().latest().get();
```

### Background Jobs
```typescript
import { dispatch } from '@arikajs/dispatcher';

await dispatch(new ProcessVideoJob(videoPath));
```

### Fluent Date Handling (Carbon)
```typescript
import { Carbon } from '@arikajs/carbon';

const nextWeek = Carbon.now().addWeek().toDateTimeString();
const diff = Carbon.parse(user.created_at).diffForHumans();
```

---

## 🛠️ CLI Commands

The ArikaJS CLI is your best friend during development.

### General Commands
- `arika new <name>`        # Scaffold a new ArikaJS application
- `arika serve --dev`       # Start the dev server with Hot Reload
- `arika list`              # List all available commands
- `arika help <command>`    # Show detailed help for a specific command
- `arika key:generate`      # Generate a secure application key

### Generators (Scaffolding)
- `arika make:model`        # Generate a Model and Migration
- `arika make:controller`   # Generate a new Controller
- `arika make:middleware`   # Generate a new Middleware
- `arika make:migration`    # Create a new migration file
- `arika make:job`          # Create a new background job class

### Database & Migrations
- `arika migrate`           # Run pending database migrations
- `arika migrate:rollback`  # Rollback the last database migration
- `arika migrate:fresh`     # Drop all tables and re-run all migrations
- `arika db:seed`           # Seed the database with records

### Queue & Background Jobs
- `arika queue:work`        # Start the background worker
- `arika queue:retry`       # Retry a failed background job
- `arika route:list`        # Display all registered application routes

---

## 🤝 Contributing

We love our community! Please see our [Contributing Guide](CONTRIBUTING.md) to learn how you can help make ArikaJS even better.

---

## 📝 License

ArikaJS is open-source software licensed under the [MIT License](../../LICENSE).

<div align="center">

**Built with ❤️ by [Prakash Tank](https://github.com/prakashtank) & The ArikaJS Team**

</div>

## 💬 Community & Support

- 📖 [Documentation](https://github.com/arikajs/arikajs#readme)
- 💬 [Discord Community](https://discord.gg/XUTjzwjrHK)
- 🐛 [Issue Tracker](https://github.com/arikajs/arikajs/issues)

---

<div align="center">

**Built with ❤️ by the ArikaJS Team**

[GitHub](https://github.com/arikajs) • [npm](https://www.npmjs.com/package/arikajs)

</div>

