## Arika Dispatcher

`@arikajs/dispatcher` is the **execution engine** of the ArikaJS ecosystem.

Before the response is sent back to the client, this package handles the **journey from route to result**:

- Route handler resolution (Closures or Controllers)
- Dependency Injection for controllers
- Method invocation with parameter injection
- Middleware pipeline execution
- Response normalization

If the following works cleanly, the dispatcher is considered correct:

```ts
const dispatcher = new Dispatcher(container);
const response = await dispatcher.dispatch(matchedRoute, request, responseInstance);
```

Arika Dispatcher is to ArikaJS the core execution engine for ArikaJS: it takes a route and makes things happen.

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Controller & Closure resolution
  - Method parameter injection (Request + Route Params)
  - Basic middleware pipeline
  - Response normalization (String, Object, Response)
- **Out of scope (for this package)**:
  - Route matching (see `@arikajs/router`)
  - Request parsing (see `@arikajs/http`)
  - Template rendering

The goal of this package is to be the **reliable executor** of application logic.

---

## Features

- **Handler Resolution**
  - Support for basic closures: `(req) => 'Hello'`
  - Support for class-based controllers: `[UserController, 'show']`
  - Automatic instantiation of controllers via Service Container

- **Method Invocation**
  - Resolves method dependencies (auto-DI if Container supports `.call()`)
  - Injects `Request` object automatically
  - Maps route parameters (e.g., `{id}`) to method arguments

- **Middleware Pipeline**
  - Executes route-specific middleware
  - **Executes Controller-specific middleware** (`static middleware = [...]` or `getMiddleware()`)
  - Onion-style execution flow (nested `next()` calls)
  - Asynchronous middleware support
  - Container-based middleware resolution

- **Exception Handling**
  - Configurable global execution wrapper `setExceptionHandler((err, req, res) => ...)`
  - Converts errors gracefully into responses

- **Response Normalization**
  - Automatically converts return values to HTTP responses
  - Objects/Arrays → JSON response
  - Strings → Plain text response
  - `null`/`undefined` → 204 No Content
  - View Objects (implementing `.render()`) → Rendered HTML
  - NodeJS Streams (`Readable`) → Piped directly to Response

---

## Installation

```bash
npm install @arikajs/dispatcher
# or
yarn add @arikajs/dispatcher
# or
pnpm add @arikajs/dispatcher
```

This package is written in TypeScript and ships with type definitions.

---

## Quick Start

### 1. Simple Dispatching

```ts
import { Dispatcher } from '@arikajs/dispatcher';

const dispatcher = new Dispatcher();
const response = await dispatcher.dispatch(matchedRoute, request, response);
```

### 2. Using Controllers with DI

```ts
import { Dispatcher } from '@arikajs/dispatcher';
import { Container } from '@arikajs/foundation';

const container = new Container();
const dispatcher = new Dispatcher(container);

// Dispatch to [UserController, 'index']
const response = await dispatcher.dispatch(matchedRoute, request, response);
```

---

## Dispatcher

The `Dispatcher` class is the central coordinator that manages the lifecycle of a request dispatch.

Core responsibilities:

- Resolves the handler (Closure or Controller)
- Manages the **middleware pipeline**
- Coordinates the **invocation** of the handler
- Ensures the return value is **normalized** into a Response

Minimal API:

```ts
class Dispatcher {
  constructor(container?: Container);

  setContainer(container: Container): this;
  dispatch(matchedRoute: MatchedRoute, request: Request, response: Response): Promise<Response>;
}
```

Typical usage:

```ts
import { Dispatcher } from '@arikajs/dispatcher';

const dispatcher = new Dispatcher(app.container);
const response = await dispatcher.dispatch(matched, request, response);
```

### Global Exception Handler

You can intercept exceptions at the edge of execution and transform them into standard JSON responses, preventing hard crashes:

```ts
dispatcher.setExceptionHandler((error, request, response) => {
    if (error.name === 'AuthorizationException') {
        return response.status(403).json({ error: error.message });
    }
    
    // Unhandled error fallback
    return response.status(500).json({ error: 'Server Error' });
});
```

---

## Controller Middleware

Middleware don't just have to live on the route. The Dispatcher automatically scans your class-based controllers for middleware and merges them into the pipeline.

```ts
class PostController {
    // Static middleware applied to all routes mapping to this controller
    static middleware = ['auth', 'verified'];

    index() { /* ... */ }
}
```

## Middleware Pipeline

The `MiddlewarePipeline` executes middleware in an "onion" pattern, where each layer can perform logic before and after the next layer.

Minimal API:

```ts
pipeline.use(middleware);
pipeline.handle(request, destination);
```

### Usage

```ts
const pipeline = new MiddlewarePipeline(container);

pipeline.use(async (req, next) => {
  const res = await next(req);
  res.header('X-Processed-By', 'Arika');
  return res;
});
```

---

## Response Resolver

The `ResponseResolver` ensures that your controller methods can stay clean by returning plain data.

Conversion Rules:

- **Objects**: Automatically converted to JSON via `response.json()`
- **Strings/Buffers**: Sent as the body via `response.send()`
- **null/undefined**: Sets status 204 (No Content)
- **Response**: Returned as-is
- **Views**: Anything with an async `render()` function calls the function and sends the result
- **Streams**: Returned values extending `stream.Stream` pipe properly if the response driver supports `.stream()`

---

## 🏗 Architecture

```text
dispatcher/
├── src/
│   ├── Contracts
│   │   ├── Container.ts
│   │   ├── Http.ts
│   │   └── Router.ts
│   ├── ControllerResolver.ts
│   ├── Dispatcher.ts
│   ├── index.ts
│   ├── MethodInvoker.ts
│   └── ResponseResolver.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Versioning & Stability

- While in **v0.x**, the API may change between minor versions.
- Once the API stabilizes, `@arikajs/dispatcher` will move to **v1.0** and follow **semver** strictly.

---

## Contributing

Contributions are welcome, especially around:

- Advanced dependency injection in controller methods
- Performance optimizations for middleware execution
- Enhanced error handling hooks
- Support for attribute-based routing

Before submitting a PR:

- Run the test suite
- Add tests for any new behavior
- Keep the public API focused and well-documented

---

## License

`@arikajs/dispatcher` is open-sourced software licensed under the **MIT license**.

---

## Philosophy

> “Routing decides the path. Dispatcher executes the journey.”
