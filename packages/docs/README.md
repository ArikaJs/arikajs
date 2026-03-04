## Arika Docs

`@arikajs/docs` is the **documentation engine** of the ArikaJS ecosystem.

It allows you to automatically generate high-quality API documentation, Postman collections, and OpenAPI specifications by analyzing your application's routes.

The goal of this package is to eliminate the manual work of keeping documentation in sync with your codebase.

---

### Status

- **Stage**: Beta / v0.x
- **Extensibility**: Driver-based architecture (add your own documentation formats)
- **Features**:
  - Route metadata extraction from `@arikajs/router`
  - Postman Collection (v2.1.0) generation
  - Arika-themed interactive HTML documentation
  - Markdown (DOCS.md) generation
  - OpenAPI 3.0 specification generation
  - **New**: Route filtering by prefix (e.g., generate docs only for `api/v1`)

---

## Features

- **🚀 Extensible architecture**
  - Uses a **Driver Pattern** for all documentation formats.
  - Easily add new drivers by implementing the `DocDriver` interface.

- **🎨 Multi-Format Generation**
  - **HTML**: A premium, interactive web page for your API.
  - **Postman**: Ready-to-import JSON collection with pre-configured headers.
  - **OpenAPI**: Industry-standard Swagger/OpenAPI 3.0 specification.
  - **Markdown**: Clean, readable `DOCS.md` for GitHub or local documentation.

- **🔍 Intelligent Route Analysis**
  - **Prefix Filtering**: Only document specific sections of your app.
  - Automatically groups endpoints by prefix (e.g., `api`, `admin`).
  - Captures route names, methods, and full path hierarchies.
  - Displays middleware and parameter information.

- **Environment Support**
  - Automatically generates Postman environment JSON with your `base_url`.

---

## Installation

```bash
npm install @arikajs/docs
```

This package is designed to be used with the ArikaJS CLI but can also be used as a standalone library.

---

## Usage (via CLI)

The easiest way to generate documentation is using the ArikaJS CLI:

```bash
arika docs:generate
```

This will create a `docs/` directory in your project root containing all generation artifacts.

---

## Standalone Usage

```ts
import { DocumentationGenerator } from '@arikajs/docs';

const generator = new DocumentationGenerator();
generator.generateAll('My App Name', './docs-output');
```

---

## Project Structure

Inside the `docs` package:

- `src/`
  - `PostmanGenerator.ts` – Handles Postman JSON generation
  - `HtmlGenerator.ts` – Handles premium HTML documentation
  - `MarkdownGenerator.ts` – Handles Markdown generation
  - `OpenApiGenerator.ts` – Handles OpenAPI 3.0 generation
  - `Generator.ts` – The main orchestrator
  - `index.ts` – Public exports

---

## Philosophy

> “Your code is the source of truth; your documentation should reflect it instantly.”

---

## Contributing

Contributions are welcome, especially around:
- Adding support for JSDoc-based parameter descriptions.
- Enhancing the HTML documentation search and "Try it out" features.
- Adding support for more documentation formats.

---

## License

`@arikajs/docs` is open-sourced software licensed under the **MIT license**.
