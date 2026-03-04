## Arika Router

`@arikajs/router` is the **routing and request-dispatching layer** of the ArikaJS framework.

It is responsible for mapping HTTP requests to route handlers in a predictable, framework-controlled way, without depending on Express, Fastify, or any external routing library.

Arika Router integrates directly with **@arikajs/http** and **@arikajs/foundation** to provide an elegant, intuitive routing experience.

---

### Status

- **Stage**: Early Development / v0.x
- **Scope (v1.x)**:
  - HTTP method based routing (GET, POST, PUT, PATCH, DELETE, ANY)
  - Path-based route matching (Static & Regex)
  - Route parameters with Regex constraints (`/users/:id`)
  - Resourceful routing (`Route.resource`)
  - Redirect routes (`Route.redirect`)
  - Central route registry
  - Route grouping with prefixes & middleware (fluent chaining)
  - Route naming and URL generation (Reverse Routing)
  - Controller resolution from container
  - Route handler execution (dispatching)
- **Out of scope (for now)**:
  - API Versioning helpers
  - Automatic OpenAPI/Swagger generation

---

## Features

- **Core Routing**
  - HTTP method based routing (GET, POST, PUT, PATCH, DELETE, ANY)
  - Redirect routes directly from the router
  - Resourceful routing capabilities
  - Path-based route matching

- **Route Grouping & Chaining**
  - Group routes with a common prefix
  - Nested groups support
  - Fluent configuration (`Route.prefix('api').middleware('auth').group(...)`)

- **Advanced Matching**
  - Parameter regular expression constraints (`where()`)
  - Method + path matching
  - Match specific parameter subsets cleanly

- **Reverse Routing**
  - Name your routes and generate fully qualified URLs dynamically

- **Dispatching**
  - Route handler execution
  - Framework-controlled dispatch flow
  - Decoupled from HTTP response handling

---

## Installation

```bash
npm install @arikajs/router
# or
yarn add @arikajs/router
# or
pnpm add @arikajs/router
```

⚠️ Requires `@arikajs/http` and `@arikajs/foundation`.

---

## Quick Start

### 1. Register Routes

```ts
import { Route } from '@arikajs/router';

Route.get('/hello', () => {
  return 'Hello World';
});

Route.post('/submit', (request) => {
  return 'Form submitted';
});
```

### 2. Route Parameters & Constraints

```ts
Route.get('/users/:id', (request, id) => {
  return `User ID: ${id}`;
})
.where('id', '[0-9]+') // Enforces that ID must be digits!
.as('users.show')
.withMiddleware(AuthMiddleware);
```

### 3. Advanced Route Types

```ts
// Respond to multiple methods
Route.any('/webhook', (req) => { ... });

// Instant 301/302 Redirection
Route.redirect('/old-path', '/new-path', 301);

// Automatic Resourceful Routes (index, create, store, show, edit, update, destroy)
import { PostController } from './controllers/PostController';
Route.resource('posts', PostController);
```

### 4. Controller Resolution

```ts
import { UserController } from './controllers/UserController';

Route.get('/users', [UserController, 'index']);
```

### 5. Route Grouping (Fluent)

```ts
Route.prefix('api/v1')
  .middleware(['auth', 'throttle'])
  .group(() => {
    Route.get('/profile', [ProfileController, 'show']);
  });
```

### 6. Reverse Routing (URL Generation)

You can generate dynamic URLs based purely on a named route.

```ts
Route.get('/posts/:id/comments/:commentId', () => { ... }).as('post.comment');

const url = router.route('post.comment', { id: 5, commentId: 10 });
// Returns: "/posts/5/comments/10"
```

---

## 🏗 Architecture

```text
router/
├── src/
│   ├── tests
│   │   └── Router.test.ts
│   ├── index.ts
│   ├── Route.ts
│   ├── RouteEntry.ts
│   ├── RouteMatcher.ts
│   ├── Router.ts
│   ├── RouteRegistry.ts
│   └── types.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

The router never writes to the response directly. It only decides **which handler should run**.

---

## Route Matching

The router matches incoming requests using method and path:

```ts
const route = routeMatcher.match('GET', '/hello');
```

Matching rules:
- Method must match exactly.
- Supports both static paths and dynamic parameters (`/users/:id`).
- The first route defined that matches will be selected.

---

## Dispatching

Once a route is matched, the dispatcher executes the handler:

```ts
await dispatcher.dispatch(route, request);
```

The dispatcher focuses purely on execution, leaving middleware and response formatting to other layers of the framework.

---

## Road Map

- [x] Route parameters (`/users/:id`)
- [x] Controller resolution from container
- [x] Route-level middleware
- [x] Named routes
- [x] Route caching for performance

---

## Versioning & Stability

- While in **v0.x**, the API may change between minor versions.
- Once the core routing engine stabilizes, `@arikajs/router` will move to **v1.0** and follow **semver** strictly.

---

## Contributing

Contributions are welcome! Please ensure you:
- Run the test suite before submitting PRs.
- Add tests for new features.
- Follow the existing coding style.

---

## License

`@arikajs/router` is open-sourced software licensed under the **MIT license**.
