# @arikajs/docs

<div align="center">

**Modern, Automated, and Multi-Format Documentation for ArikaJS**

[![npm version](https://img.shields.io/npm/v/@arikajs/docs.svg?style=flat-square)](https://www.npmjs.com/package/@arikajs/docs)
[![License: BSL-1.1](https://img.shields.io/badge/License-BSL_1.1-orange.svg?style=flat-square)](../../LICENSE)

</div>

---

## 🚀 Purpose

`@arikajs/docs` is the official documentation engine for the ArikaJS ecosystem. It eliminates the manual work of maintaining API docs by analyzing your application's routes and automatically generating high-quality artifacts in multiple formats.

With one command, you can have a full suite of Postman collections, OpenAPI specs, and interactive HTML documentation that stays perfectly in sync with your codebase.

---

## ✨ Feature Highlights

- 🎨 **Multi-Format Generation** - HTML, Postman (v2.1), OpenAPI (3.0), and Markdown.
- 🔍 **Intelligent Analysis** - Automatically groups endpoints and detects parameters.
- 📡 **Live Sync** - Generates docs based on your actual route definitions.
- 🎯 **Prefix Filtering** - Generate documentation for specific API versions or modules.
- 🍱 **Modular & Optional** - Install it only when you need it.
- 🪄 **Dynamic CLI Integration** - Adds `docs:*` commands to your Arika CLI automatically.

---

## 📦 Installation

Install the package via npm:

```bash
npm install @arikajs/docs
```

Once installed, use the Arika CLI to safely scaffold your documentation config:

```bash
node arika docs:install
```

### 🛠️ Configuration

The installation command creates a `config/docs.ts` file. You can customize your output paths and exclusions there:

```typescript
export default {
    title: 'My Awesome API',
    version: '1.0.0',
    output: {
        html: './docs/html',
        postman: './docs/postman_collection.json',
        openapi: './docs/openapi.yaml',
    }
};
```

---

## 📚 Basic Usage

### 1. Register the Provider
Add the `DocsServiceProvider` to your `bootstrap/app.ts` to enable documentation commands:

```typescript
import { DocsServiceProvider } from '@arikajs/docs';

app.register(DocsServiceProvider);
```

### 2. Generate Documentation
Run the generator command to scan your routes and create the artifacts:

```bash
node arika docs:generate
```

---

## 🛡️ Safety Policy

The `@arikajs/docs` package follows a strict **non-destructive** installation policy:
- `docs:install` will never overwrite your existing `config/docs.ts` unless the `--force` flag is used.
- It will never modify or delete your application's route logic or controllers.

---

## 📝 License

ArikaJS Docs is licensed under the [Business Source License 1.1 (BSL-1.1)](../../LICENSE).
