## Arika Middleware

`@arikajs/middleware` provides a flexible, composable middleware system for the ArikaJS framework.

Middleware allows developers to inspect, modify, or short-circuit the request/response lifecycle before the final route handler is executed.

This package is framework-agnostic and is used by both the HTTP Kernel and the Dispatcher.

```ts
const pipeline = new Pipeline();

pipeline.pipe(async (req, next) => {
    console.log('Before');
    const res = await next(req);
    console.log('After');
    return res;
});

const response = await pipeline.handle(request, (req) => {
    return new Response('Hello World');
});
```

Arika Middleware follows the **onion-style execution model**, ensuring a predictable flow for request and response modification.

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Onion-style pipeline execution
  - Middleware contracts (interface & types)
  - Composable middleware stacks (Compose utility)
  - Support for functional and class-based middleware
- **Out of scope (for this package)**:
  - Route matching (handled by `@arikajs/router`)
  - Controller resolution (handled by `@arikajs/dispatcher`)

---

## 🎯 Purpose

Middleware sits between the incoming request and the final handler.

Typical use cases:
- Authentication & authorization
- Logging & metrics
- Request transformation
- Response modification
- Rate limiting
- CORS handling

---

## 🧠 Responsibility

### ✅ What Middleware Does
- Execute logic before and/or after the route handler
- Control the request flow using `next()`
- Modify request or response objects
- Short-circuit execution by returning a response early
- Support asynchronous operations

### ❌ What Middleware Does NOT Do
- Match routes
- Resolve controllers
- Render templates
- Handle business logic

---

## 🧬 Execution Flow

```
Request
  ↓
Middleware A
  ↓
Middleware B
  ↓
Route Handler
  ↓
Middleware B (after)
  ↓
Middleware A (after)
  ↓
Response
```

---

## Features

- **Onion-style pipeline execution**
  - Execute logic before and after the handler.
  - Symmetrical execution flow.

- **Async middleware support**
  - Full support for `async/await`.
  - Seamless handling of asynchronous operations.

- **Early response termination**
  - Short-circuit execution by returning a response without calling `next()`.
  - Useful for authentication and validation.

- **Composable middleware stacks**
  - Group multiple middleware into a single unit using `compose()`.
  - Highly reusable and easy to organize.

- **Framework-level & route-level compatibility**
  - Works globally via kernels or specifically via route definitions.

- **Minimal, predictable API**
  - Small surface area for maximum stability.
  - Zero dependencies on other logic besides `@arikajs/http`.

---

## Installation

```bash
npm install @arikajs/middleware
```

This package is written in TypeScript and ships with type definitions.

---

## Quick Start

### 1. Create a middleware

```ts
export const logger = async (request, next) => {
    console.log(`${request.method} ${request.path}`);
    const response = await next(request);
    return response;
};
```

### 2. Run through a Pipeline

```ts
import { Pipeline } from '@arikajs/middleware';

const pipeline = new Pipeline().pipe(logger);

const response = await pipeline.handle(request, (req) => {
    return new Response('Handled');
});
```

### 3. Applying to Routes (via @arikajs/router)

```ts
Route.get('/dashboard', handler)
    .middleware([authMiddleware, logger]);
```

### 4. Global Middleware (via HTTP Kernel)

```ts
kernel.use(logger);
```

### 5. Middleware with Arguments

You can pass arguments to middleware using a colon `:` separator.

```ts
// In your middleware definition:
export const checkRole = async (req, next, role) => {
    if (req.user.role !== role) {
        return new Response('Unauthorized', 403);
    }
    return next(req);
};

// When usage:
pipeline.pipe('auth:admin');
```

---

## 🏛 Named Middleware & Groups

You can register aliases and groups to keep your middleware definitions clean.

```ts
pipeline.setAliases({
    'auth': AuthMiddleware,
    'guest': GuestMiddleware
});

pipeline.setMiddlewareGroups({
    'web': ['cookie', 'session', 'verifyCsrf'],
    'api': ['throttle', 'auth:api']
});

// Usage
pipeline.pipe('web');
pipeline.pipe('auth:admin');
```

---

## Middleware Pipeline

The `Pipeline` class is the central engine of the middleware system. It manages a stack of middleware and executes them in the order they were added.

### API

```ts
class Pipeline<TRequest = any, TResponse = any> {
    constructor(container?: Container);
    pipe(middleware: MiddlewareHandler<TRequest, TResponse> | MiddlewareHandler<TRequest, TResponse>[]): this;
    handle(
        request: TRequest, 
        destination: (request: TRequest, response?: TResponse) => Promise<TResponse> | TResponse,
        response?: TResponse
    ): Promise<TResponse>;
}
```

---

## Composing Middleware

The `compose` utility allows you to merge multiple middleware handlers into a single function.

```ts
import { compose } from '@arikajs/middleware';

const authStack = compose([
    validateToken,
    checkPermissions
]);

pipeline.pipe(authStack);
```

---

## 🏗 Architecture

```text
middleware/
├── src/
│   ├── Contracts
│   │   ├── Container.d.ts.map
│   │   └── Container.ts
│   ├── Compose.d.ts.map
│   ├── Compose.ts
│   ├── index.d.ts.map
│   ├── index.ts
│   ├── Middleware.d.ts.map
│   ├── Middleware.ts
│   ├── Pipeline.d.ts.map
│   └── Pipeline.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Versioning & Stability

- Currently in **v0.x** (experimental).
- Public API may evolve.
- Will stabilize in **v1.0** once execution semantics are finalized.

---

## 📜 License

`@arikajs/middleware` is licensed under the **Business Source License 1.1 ([BSL-1.1](../../LICENSE))**.

---

## 🧠 Philosophy

> “Middleware is not logic — it is flow control.”

---