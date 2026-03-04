# Arika HTTP

<div align="center">

![ArikaJS Logo](http://13.232.79.11:7800/down/oZ9NpyKtAQzK.png)

</div>

`@arikajs/http` is the **web engine** for the ArikaJS ecosystem.

Arika HTTP provides a native, framework-controlled HTTP layer that sits directly on top of Node.js HTTP primitives. It handles the request lifecycle, routing, and middleware without relying on external frameworks like Express or Fastify.

If the following works cleanly, the HTTP layer is considered correct:

```ts
const app = new Application(basePath);
const kernel = new HttpKernel(app);

const server = http.createServer((req, res) => {
  kernel.handle(req, res);
});

server.listen(3000);
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - HTTP Kernel (Request/Response lifecycle)
  - Router (RESTful routing, route parameters)
  - Middleware system (Pipeline pattern)
  - Request & Response abstractions (Fluent API)
  - Controller resolution via Service Container
- **Out of scope (for this package)**:
  - WebSocket support
  - Session/Cookie persistence (contracts only)
  - CSRF/Security headers (middleware only)
  - File upload parsing (use middleware)

---

## Features

- **HTTP Kernel**
  - Central entry point for all HTTP requests
  - Implements the Foundation `Kernel` contract
  - Manages the global middleware stack

- **Powerful Routing**
  - Express-like routing API (`get`, `post`, `put`, `delete`)
  - Route parameters (e.g., `/user/:id`)
  - Route-specific middleware
  - Controller resolution directly from the DI container

- **Middleware Pipeline**
  - Chainable middleware execution
  - Supports both class-based and closure-based middleware
  - Short-circuiting for authentication and validation

- **Request & Response**
  - Immutable `Request` wrapper for Node's `IncomingMessage`
  - Fluent `Response` builder for Node's `ServerResponse`
  - JSON-first responses and status code helpers

---

## Installation

```bash
npm install @arikajs/http
# or
yarn add @arikajs/http
# or
pnpm add @arikajs/http
```

This package requires `@arikajs/foundation` as a peer dependency.

---

## Quick Start

### 1. Define a Controller

```ts
class UserController {
  async show(request: Request, id: string) {
    return { id, name: 'John Doe' };
  }
}
```

### 2. Configure the Router

```ts
import { Router } from '@arikajs/http';

const router = new Router();

router.get('/users/:id', [UserController, 'show']);
```

### 3. Initialize the Kernel and Server

```ts
import { Application } from '@arikajs/foundation';
import { HttpKernel } from '@arikajs/http';
import http from 'node:http';

const app = new Application(__dirname);
const kernel = new HttpKernel(app);

// Register routes if needed via a Service Provider or direct injection
kernel.getRouter().get('/', (req) => ({ hello: 'arika' }));

const server = http.createServer((req, res) => {
  kernel.handle(req, res);
});

server.listen(3000);
```

---

## Http Kernel

The `HttpKernel` is the "heart" of your web application. It receives a Node.js request and response, and coordinates the entire framework lifecycle to produce an output.

Core responsibilities:
- Bootstrapping the application if not already booted
- Converting Node.js primitives into Arika `Request` and `Response` objects
- Sending the request through the global middleware pipeline
- Dispatching the request to the Router

---

## Router

The Arika Router allows you to define your application's routes using a simple, expressive API.

### Basic Routing
```ts
router.get('/hello', (request) => 'Hello World');
router.post('/data', async (request) => {
  const body = await request.body();
  return { received: body };
});
```

### Route Parameters
```ts
router.get('/posts/:slug', (request, slug) => {
  return `Viewing post: ${slug}`;
});
```

---

## Middleware

Middleware provide a convenient mechanism for inspecting and filtering HTTP requests entering your application.

### Class-based Middleware
```ts
import { Middleware, Request, Response } from '@arikajs/http';

class AuthMiddleware implements Middleware {
  async handle(request: Request, next: Function): Promise<Response> {
    if (!request.header('Authorization')) {
      return new Response().status(401).json({ error: 'Unauthorized' });
    }
    return next(request);
  }
}
```

---

## Request & Response

### Request
The `Request` object provides a clean API for interacting with the current HTTP request.

```ts
request.path(); // /users/1
request.method(); // GET
request.baseUrl(); // http://localhost:3000 (uses Host header or config.app.url)
request.query('page'); // ?page=1
request.header('Content-Type');
request.all(); // combined input
```

### Response
The `Response` object allows you to build a response using a fluent interface.

```ts
return response
  .status(201)
  .header('X-Custom', 'Value')
  .json({ created: true });
```

---

## 🏗 Architecture

```text
http/
├── src/
│   ├── Contracts
│   │   └── Application.ts
│   ├── Exceptions
│   │   └── HttpException.ts
│   ├── Middleware
│   │   ├── BodyParserMiddleware.ts
│   │   ├── ConvertEmptyStringsToNull.ts
│   │   ├── CorsMiddleware.ts
│   │   └── TrimStrings.ts
│   ├── HttpKernel.ts
│   ├── HttpServiceProvider.ts
│   ├── index.ts
│   ├── Middleware.ts
│   ├── Pipeline.ts
│   ├── Request.ts
│   ├── Response.ts
│   └── Router.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Versioning & Stability

- While in **v0.x**, the API may change between minor versions.
- Post **v1.0**, we will follow **semver** strictly.
- `@arikajs/http` aims to maintain a stable contract with `@arikajs/foundation`.

---

## Contributing

Contributions are welcome! Please check the issues or submit a pull request for:
- Router optimizations
- New built-in middleware
- Improved Request/Response helper methods

---

## License

`@arikajs/http` is open-sourced software licensed under the **MIT license**.
