## Arika Authorization

`@arikajs/authorization` provides a powerful, enterprise-grade authorization (access control) system for the ArikaJS framework.

It answers one critical question: **"Is the authenticated user allowed to perform this action?"**

```ts
// Per-request scoped — safe for concurrent requests
if (await req.can('edit-post', post)) {
  // authorized
}
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope**:
  - Gate-based authorization with `before()` / `after()` hooks
  - Policy-based authorization with auto-discovery
  - Response-based authorization (custom deny messages)
  - Role & Permission system
  - Bulk ability checks (`any` / `every` / `none`)
  - Request-scoped authorization context (concurrency safe)
  - Authorization middleware with role/permission support
  - Result caching per-request for performance
- **Design**:
  - Framework-agnostic (usable outside HTTP layer)
  - Decoupled from transport layer
  - Type-safe APIs

---

## ✨ Purpose

Authorization is not authentication.

- **Authentication** → Who is the user? (Handled by `@arikajs/auth`)
- **Authorization** → What can the user do? (Handled by `@arikajs/authorization`)

This package works on top of `@arikajs/auth` but remains fully decoupled from it.

---

## 🚀 Features

- **Gate-based authorization** — Simple closure-based checks with before/after hooks.
- **Policy-based authorization** — Organize logic per model/resource with `before()` bypass.
- **Response-based authorization** — Return custom deny messages instead of plain booleans.
- **Role & Permission system** — First-class role and permission checking.
- **Bulk ability checks** — `Gate.any()`, `Gate.every()`, `Gate.none()` for multi-ability checks.
- **Request-scoped context** — Memory-safe, per-request isolation with built-in result caching.
- **Middleware integration** — Protect routes with `can:`, `role:`, and `permission:` prefixes.
- **Type-safe APIs** — Built for TypeScript.

---

## 📦 Installation

```bash
npm install @arikajs/authorization
```

---

## 🧠 Core Concepts

### 1️⃣ Gates

Gates are simple ability checks defined globally.

```ts
import { Gate } from '@arikajs/authorization';

Gate.define('edit-post', (user, post) => {
  return user.id === post.userId;
});
```

**Usage:**

```ts
if (await Gate.forUser(user).allows('edit-post', post)) { ... }
if (await Gate.forUser(user).denies('edit-post', post)) { ... }
```

### 2️⃣ Policies

Policies organize authorization logic around a specific model or resource.

```ts
class PostPolicy {
  // Super admin bypass — runs before any check
  before(user: any, ability: string) {
    if (user.isSuperAdmin) return true;
    return null; // continue to actual check
  }

  view(user: any, post: Post) {
    return true;
  }

  update(user: any, post: Post) {
    return user.id === post.userId;
  }

  delete(user: any, post: Post) {
    if (user.id !== post.userId) {
      return AuthResponse.deny('You do not own this post.', 'POST_NOT_OWNED');
    }
    return AuthResponse.allow();
  }
}
```

**Register & Use:**

```ts
Gate.policy(Post, PostPolicy);

// Automatically resolves to PostPolicy.update
await Gate.forUser(user).allows('update', post);
```

### 3️⃣ Authorization Context (Per-Request)

Each request should get its own `AuthorizationContext` for isolation and caching:

```ts
const ctx = new AuthorizationContext(user);

await ctx.can('edit-post', post);     // true
await ctx.cannot('delete-post', post); // true
await ctx.authorize('edit-post', post); // throws if denied
```

---

## 🔑 Role & Permission System

ArikaJS Authorization provides first-class role and permission checking:

```ts
import { RolePermissionMixin, AuthorizationContext } from '@arikajs/authorization';

// Direct usage
RolePermissionMixin.hasRole(user, 'admin');           // true/false
RolePermissionMixin.hasAnyRole(user, ['admin', 'editor']);
RolePermissionMixin.hasPermission(user, 'edit-posts');
RolePermissionMixin.hasAllPermissions(user, ['view-posts', 'edit-posts']);

// Via request-scoped context
const ctx = new AuthorizationContext(user);
ctx.hasRole('admin');
ctx.hasAnyPermission(['edit-posts', 'delete-posts']);
```

User objects should have `roles` and `permissions` arrays (strings or `{name: string}` objects).

---

## 🛡️ Before / After Hooks

### Global Before Hook (Super Admin Bypass)

```ts
Gate.before((user, ability) => {
  if (user.isSuperAdmin) return true; // Bypasses ALL checks
  return null; // Continue to actual check
});
```

### Global After Hook (Audit Logging)

```ts
Gate.after((user, ability, result) => {
  console.log(`${user.name} → ${ability}: ${result ? 'ALLOWED' : 'DENIED'}`);
});
```

### Policy-Level Before Hook

```ts
class PostPolicy {
  before(user, ability) {
    if (user.isSuperAdmin) return true;
    return null;
  }
}
```

---

## 🔍 Bulk Ability Checks

Check multiple abilities in a single call:

```ts
// Can the user do ANY of these?
await Gate.forUser(user).any(['edit-post', 'delete-post'], post);

// Can the user do ALL of these?
await Gate.forUser(user).every(['edit-post', 'publish-post'], post);

// Can the user do NONE of these?
await Gate.forUser(user).none(['admin-only', 'super-admin-only']);
```

---

## 💬 Response-Based Authorization

Instead of returning plain `true`/`false`, return an `AuthResponse` with custom error messages:

```ts
import { AuthResponse } from '@arikajs/authorization';

Gate.define('edit-post', (user, post) => {
  if (user.id !== post.userId) {
    return AuthResponse.deny('You do not own this post.', 'POST_NOT_OWNED');
  }
  return AuthResponse.allow();
});

// Inspect the full response
const response = await Gate.forUser(user).inspect('edit-post', post);
response.allowed();  // false
response.message();  // 'You do not own this post.'
response.code();     // 'POST_NOT_OWNED'
```

---

## 🧩 Middleware Support

Protect routes using authorization middleware with multiple strategies:

```ts
// Gate/Policy check
Route.get('/posts/:id/edit', controller).middleware('can:edit-post');

// Role-based
Route.get('/admin', controller).middleware('role:admin');
Route.get('/dashboard', controller).middleware('role:admin,editor');

// Permission-based
Route.get('/settings', controller).middleware('permission:manage-settings');
```

Middleware automatically:
1.  Resolves the authenticated user.
2.  Executes the authorization check.
3.  Throws `403 Forbidden` on failure.

---

## ⚡ Performance

- **Per-request caching**: `AuthorizationContext` caches ability results within a single request, preventing redundant gate/policy evaluation.
- **Policy instance caching**: `PolicyResolver` caches instantiated policy objects instead of creating new ones on every call.
- **Short-circuit evaluation**: `before()` hooks return immediately without running the actual check.
- **Bulk checks early-exit**: `any()` returns on first `true`, `none()` returns on first `true`.

---

## 🏗 Architecture

```text
authorization/
├── src/
│   ├── Contracts
│   │   └── Policy.ts
│   ├── Exceptions
│   │   └── AuthorizationException.ts
│   ├── Middleware
│   │   └── Authorize.ts
│   ├── AuthorizationContext.ts
│   ├── AuthorizationManager.ts
│   ├── AuthResponse.ts
│   ├── Gate.ts
│   ├── index.ts
│   ├── PolicyResolver.ts
│   └── RolePermission.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```


---

## 🔌 Integration with ArikaJS

| Package | Responsibility |
| :--- | :--- |
| `@arikajs/auth` | User authentication |
| `@arikajs/authorization` | Access control |
| `@arikajs/router` | Route matching |
| `@arikajs/http` | Request & response handling |

---

## 📌 Design Philosophy

- **Explicit over implicit**: Authorization rules should be clear.
- **Centralized rules**: Keep logic in Gates or Policies, not controllers.
- **Rich feedback**: Return custom error messages, not just true/false.
- **Performance first**: Cache results, short-circuit, instance re-use.
- **Decoupled from transport layer**: Logic works for HTTP, CLI, etc.

> "Authentication identifies the user. Authorization empowers or restricts them."

---

## 🔄 Versioning & Stability

- Current version: **v0.x** (Experimental)
- API may change until **v1.0**
- Will follow semantic versioning after stabilization

---

## 📜 License

`@arikajs/authorization` is open-sourced software licensed under the **MIT License**.
