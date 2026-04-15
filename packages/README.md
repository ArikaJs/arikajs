# ArikaJS Packages

This directory contains the core modules that power the **ArikaJS Framework**. ArikaJS is designed as a modular monorepo, where each component is built as a decoupled, high-quality package that can often be used independently.

---

## 📦 Core Framework

| Package | Description |
| :--- | :--- |
| [**`arikajs`**](./arikajs) | The main framework entry point and container. |
| [**`@arikajs/foundation`**](./foundation) | The core application foundation and service container. |
| [**`@arikajs/cli`**](./cli) | Command-line interface for scaffolding and managing applications. |

## 🌐 HTTP & Routing

| Package | Description |
| :--- | :--- |
| [**`@arikajs/http`**](./http) | Modern HTTP request and response implementation. |
| [**`@arikajs/router`**](./router) | High-performance, expressive routing engine. |
| [**`@arikajs/dispatcher`**](./dispatcher) | Request/dispatch pipeline orchestration. |
| [**`@arikajs/middleware`**](./middleware) | Standardized middleware architecture. |
| [**`@arikajs/session`**](./session) | Modern session management for web applications. |

## 🗄️ Data & Storage

| Package | Description |
| :--- | :--- |
| [**`@arikajs/database`**](./database) | Active Record ORM and Database query builder. |
| [**`@arikajs/storage`**](./storage) | Fluent file storage abstraction (Local, S3, etc). |
| [**`@arikajs/cache`**](./cache) | Multi-driver caching system (Redis, File, Memory). |

## 🔐 Security & Logic

| Package | Description |
| :--- | :--- |
| [**`@arikajs/auth`**](./auth) | Full-featured authentication system. |
| [**`@arikajs/authorization`**](./authorization) | Policy-based authorization and gates. |
| [**`@arikajs/encryption`**](./encryption) | Secure data encryption and hashing utilities. |
| [**`@arikajs/validation`**](./validation) | Schema-based request and data validation. |

## 🛠️ Essential Services

| Package | Description |
| :--- | :--- |
| [**`@arikajs/view`**](./view) | Lightning-fast Arika template engine (Blade-inspired). |
| [**`@arikajs/queue`**](./queue) | Background job processing and workers. |
| [**`@arikajs/scheduler`**](./scheduler) | Fluid task and cron-job scheduling. |
| [**`@arikajs/mail`**](./mail) | Expressive API for sending emails. |
| [**`@arikajs/events`**](./events) | Event-driven architecture and listeners. |
| [**`@arikajs/logging`**](./logging) | Context-aware logging system. |
| [**`@arikajs/localization`**](./localization) | Multi-language and i18n support. |

## 🧪 Utilities & Tools

| Package | Description |
| :--- | :--- |
| [**`@arikajs/carbon`**](./carbon) | Fluent date/time manipulation (Carbon for JS). |
| [**`@arikajs/console`**](./console) | Modern console output and command building tools. |
| [**`@arikajs/config`**](./config) | Robust configuration management. |
| [**`@arikajs/docs`**](./docs) | Automated API and documentation generator. |
| [**`@arikajs/socialite`**](./socialite) | OAuth authentication for social providers. |
| [**`@arikajs/sweet`**](./sweet) | Sweet UI and helper components. |
| [**`@arikajs/benchmark`**](./benchmark) | Framework-wide performance benchmarking suite. |

---

## 🤝 Contributing

Each package in this directory follows the same development standards. If you wish to contribute to a specific package, please navigate to that package's directory to see its specific documentation and tests.

ArikaJS is open-source software licensed under the [MIT License](../LICENSE).
