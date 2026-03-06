# ArikaJS Framework - Monorepo

<div align="center">

<img src="./packages/cli/templates/app/public/assets/img/logo.png" alt="ArikaJS Logo" width="400">

**A Modern, Elegant Web Framework for Node.js**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Performance](https://img.shields.io/badge/Performance-2.5x_Faster_than_Express-orange.svg)](#-blazing-fast-performance)
[![Speed](https://img.shields.io/badge/Speed-Outperforms_Fastify-red.svg)](#-blazing-fast-performance)

</div>

---

## ⚡ Blazing Fast Performance

ArikaJS is architected for extreme speed. In our latest benchmarks, it consistently outperforms the industry standards.

| Framework | Throughput (req/s) | Latency (avg) |
| :--- | :--- | :--- |
| **ArikaJS** | **40,450** 🥇 | **4.2ms** |
| Fastify | 40,100 🥈 | 4.3ms |
| Express | 16,900 🥉 | 11.4ms |

> 🚀 **ArikaJS is up to 2.5x faster than Express** and even slightly surpasses Fastify in overall throughput. 

---

## 📦 Packages

This monorepo contains all the core packages that make up the ArikaJS framework:

### Core Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`arikajs`](./packages/arikajs) | [![npm](https://img.shields.io/npm/v/arikajs.svg)](https://www.npmjs.com/package/arikajs) | Main framework package |
| [`@arikajs/cli`](./packages/cli) | [![npm](https://img.shields.io/npm/v/@arikajs/cli.svg)](https://www.npmjs.com/package/@arikajs/cli) | Command-line interface |
| [`@arikajs/foundation`](./packages/foundation) | [![npm](https://img.shields.io/npm/v/@arikajs/foundation.svg)](https://www.npmjs.com/package/@arikajs/foundation) | Application foundation |

### HTTP & Routing

| Package | Version | Description |
|---------|---------|-------------|
| [`@arikajs/http`](./packages/http) | [![npm](https://img.shields.io/npm/v/@arikajs/http.svg)](https://www.npmjs.com/package/@arikajs/http) | HTTP request/response |
| [`@arikajs/router`](./packages/router) | [![npm](https://img.shields.io/npm/v/@arikajs/router.svg)](https://www.npmjs.com/package/@arikajs/router) | Routing system |
| [`@arikajs/dispatcher`](./packages/dispatcher) | [![npm](https://img.shields.io/npm/v/@arikajs/dispatcher.svg)](https://www.npmjs.com/package/@arikajs/dispatcher) | Request dispatcher |
| [`@arikajs/middleware`](./packages/middleware) | [![npm](https://img.shields.io/npm/v/@arikajs/middleware.svg)](https://www.npmjs.com/package/@arikajs/middleware) | Middleware pipeline |

### Database & ORM

| Package | Version | Description |
|---------|---------|-------------|
| [`@arikajs/database`](./packages/database) | [![npm](https://img.shields.io/npm/v/@arikajs/database.svg)](https://www.npmjs.com/package/@arikajs/database) | Database layer & ORM |

### Authentication & Security

| Package | Version | Description |
|---------|---------|-------------|
| [`@arikajs/auth`](./packages/auth) | [![npm](https://img.shields.io/npm/v/@arikajs/auth.svg)](https://www.npmjs.com/package/@arikajs/auth) | Authentication system |
| [`@arikajs/authorization`](./packages/authorization) | [![npm](https://img.shields.io/npm/v/@arikajs/authorization.svg)](https://www.npmjs.com/package/@arikajs/authorization) | Authorization & policies |
| [`@arikajs/encryption`](./packages/encryption) | [![npm](https://img.shields.io/npm/v/@arikajs/encryption.svg)](https://www.npmjs.com/package/@arikajs/encryption) | Encryption utilities |

### Additional Services

| Package | Version | Description |
|---------|---------|-------------|
| [`@arikajs/validation`](./packages/validation) | [![npm](https://img.shields.io/npm/v/@arikajs/validation.svg)](https://www.npmjs.com/package/@arikajs/validation) | Request validation |
| [`@arikajs/logging`](./packages/logging) | [![npm](https://img.shields.io/npm/v/@arikajs/logging.svg)](https://www.npmjs.com/package/@arikajs/logging) | Logging system |
| [`@arikajs/cache`](./packages/cache) | [![npm](https://img.shields.io/npm/v/@arikajs/cache.svg)](https://www.npmjs.com/package/@arikajs/cache) | Caching layer |
| [`@arikajs/queue`](./packages/queue) | [![npm](https://img.shields.io/npm/v/@arikajs/queue.svg)](https://www.npmjs.com/package/@arikajs/queue) | Queue & jobs |
| [`@arikajs/events`](./packages/events) | [![npm](https://img.shields.io/npm/v/@arikajs/events.svg)](https://www.npmjs.com/package/@arikajs/events) | Event system |
| [`@arikajs/mail`](./packages/mail) | [![npm](https://img.shields.io/npm/v/@arikajs/mail.svg)](https://www.npmjs.com/package/@arikajs/mail) | Email sending |
| [`@arikajs/storage`](./packages/storage) | [![npm](https://img.shields.io/npm/v/@arikajs/storage.svg)](https://www.npmjs.com/package/@arikajs/storage) | File storage |
| [`@arikajs/view`](./packages/view) | [![npm](https://img.shields.io/npm/v/@arikajs/view.svg)](https://www.npmjs.com/package/@arikajs/view) | Template engine |
| [`@arikajs/console`](./packages/console) | [![npm](https://img.shields.io/npm/v/@arikajs/console.svg)](https://www.npmjs.com/package/@arikajs/console) | Console commands |

---

## 🚀 Quick Start

### For Users

The fastest way to create a new ArikaJS project is using `npx`. No installation required!

```bash
# Create a new project
npx @arikajs/cli new my-app

# Start developing
cd my-app
npm run dev
```

### For Contributors

ArikaJS uses a monorepo structure managed by **Npm Workspaces** and **Turborepo**.

```bash
# Clone the repository
git clone https://github.com/arikajs/arikajs.git
cd arikajs

# Install all dependencies
npm install

# Build all packages in parallel (using Turbo)
npm run build

# Run all tests (using Turbo)
npm test
```

---

## 🏗️ Architecture

ArikaJS follows a modular architecture where each package has a specific responsibility:

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│         (Your Application Code)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          arikajs (Core Package)         │
│   Re-exports & integrates all packages  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Foundation & Container          │
│  Service Providers, DI, Configuration   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    HTTP Layer (Router, Dispatcher)      │
│  Request handling, Routing, Middleware  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Feature Packages (Modular)         │
│  Auth, Database, Cache, Queue, etc.     │
└─────────────────────────────────────────┘
```

---

## 🛠️ Development

### Building Packages

Build all packages using Turborepo (this is fast as it uses parallel builds and caching):

```bash
npm run build
```

Build a specific package:

```bash
npm run build --workspace=@arikajs/auth
```

### Testing

Run all tests across the framework:

```bash
npm test
```

Run tests for a specific package:

```bash
npm test --workspace=@arikajs/auth
```

---

## 📝 Publishing

Versioning and publishing are handled by **Changesets**.

### 1. Create a changeset
When you make a change, run:
```bash
npm run change
```

### 2. Version packages
When ready to release, run:
```bash
npm run version-packages
```

### 3. Publish to NPM
```bash
npm run release
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Create a changeset**: `npm run change`
5. **Run tests**: `npm test`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

---

## 📜 License

All packages in this monorepo are open-sourced software licensed under the [MIT license](LICENSE).

---

## 🙏 Acknowledgments

ArikaJS draws inspiration from the best practices and design patterns of modern web frameworks, focusing on elegant API design, excellent developer experience, and robust TypeScript architecture.

---

## 💬 Community

- 📖 [Documentation](https://github.com/arikajs/arikajs#readme)
- 💬 [Discord](https://discord.gg/arikajs)
- 🐦 [Twitter](https://twitter.com/arikajs)

---

<div align="center">

**Built with ❤️ by [Prakash Tank](https://github.com/prakashtank) and contributors**

[GitHub](https://github.com/arikajs) • [npm](https://www.npmjs.com/package/arikajs)

</div>
