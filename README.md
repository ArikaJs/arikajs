
# ArikaJS

ArikaJS is a modern, modular, TypeScript-first Node.js framework designed for building scalable and maintainable server-side applications.

This repository is the main framework package that assembles and boots all ArikaJS core packages into a unified developer experience.

This package does not implement features — it composes them.

---

## 💡 Core Idea

ArikaJS is built around a package-driven architecture:

- **Each responsibility lives in its own package**
- **Packages are independent, testable, and reusable**
- **The framework layer wires everything together**
- **Applications stay clean, predictable, and scalable**

---

## 🛠 What This Repository Does

The `arikajs` package:

- Installs all required core packages
- Registers service providers
- Boots the application lifecycle
- Connects HTTP, routing, middleware, and execution flow
- Exposes a simple public API for application developers

This is the entry point developers interact with.

---

## 📦 Included Core Packages

ArikaJS internally composes the following packages:

| Package | Purpose |
| :--- | :--- |
| **@arikajs/foundation** | Application container & lifecycle |
| **@arikajs/http** | Request & Response primitives |
| **@arikajs/router** | Route definition & matching |
| **@arikajs/dispatcher** | Route execution engine |
| **@arikajs/middleware** | Middleware pipeline |
| **@arikajs/view** | Server-side rendering & templates |
| **@arikajs/validation** | Data & request validation |
| **@arikajs/auth** | Authentication |
| **@arikajs/authorization** | Authorization & access control |
| **@arikajs/storage** | Filesystem abstraction |
| **@arikajs/mail** | Email system |
| **@arikajs/events** | Event dispatcher |
| **@arikajs/queue** | Background jobs |
| **@arikajs/logging** | Application logging |
| **@arikajs/cache** | Cache abstraction |
| **@arikajs/console** | Console commands |
| **@arikajs/cli** | Project scaffolding & tooling |

---

## 🚀 Installation

```bash
npm install arikajs
# or
yarn add arikajs
# or
pnpm add arikajs
```

---

## 🔥 Quick Start

```ts
import { createApp } from 'arikajs';

const app = createApp();

app.get('/', () => {
  return 'Hello from ArikaJS';
});

app.listen(3000);
```

---

## 🧠 Framework Responsibilities

The framework layer is responsible for:

- Creating the Application instance
- Registering all core service providers
- Booting the HTTP kernel
- Linking router → dispatcher → middleware
- Managing request → response lifecycle
- Exposing a stable developer API

---

## 🔄 Request Lifecycle

```text
Incoming Request
      ↓
HTTP Kernel
      ↓
Middleware Pipeline
      ↓
Router
      ↓
Dispatcher
      ↓
Handler (Controller / Closure)
      ↓
Response
```

---

## 🏗 Project Structure

```text
arikajs/
├── src/
│   ├── createApp.ts
│   ├── Application.ts
│   ├── providers/
│   ├── http/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏷 Versioning

Uses Semantic Versioning:
- **0.x** — experimental, fast iteration
- **1.0.0** — stable public API
- Individual packages may evolve independently

---

## 🚦 Status

🚧 **Active Development**

The framework is under active development while APIs stabilize and documentation expands.

---

## 📄 License

ArikaJS is open-sourced software licensed under the **MIT license**.

---

## 🧭 Philosophy

> "Packages give power. The framework gives direction."

ArikaJS focuses on clarity, structure, and long-term maintainability.
