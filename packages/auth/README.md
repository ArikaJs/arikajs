## Arika Auth

`@arikajs/auth` provides a flexible authentication system for the ArikaJS framework.

It enables applications to authenticate users using session-based (web) or token-based (API) guards, while remaining lightweight, extensible, and framework-agnostic.

```ts
import { AuthManager } from '@arikajs/auth';

// Per-request scoped — safe for concurrent requests
const user = await req.auth.user();
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Multi-guard authentication (Session & Token)
  - User Provider interface
  - Password hashing
  - Middleware integration
  - JS & TS friendly API
- **Out of scope (for this package)**:
  - OAuth logic
  - Database ORM implementation
  - Authorization (Policies/Gates)

---

## 🎯 Purpose

Authentication answers one core question: **“Who is the current user?”**

This package is responsible for:
- Authenticating users
- Managing login & logout
- Maintaining authentication state
- Providing guards for different auth strategies
- Integrating with HTTP middleware and controllers

---

## 🧠 Responsibilities

### ✅ What Arika Auth Does
- Authenticate users via multiple guards
- Support session and token authentication
- Hash and verify passwords securely
- Attach authenticated user to the request
- Provide authentication middleware
- Offer a clean API for controllers and routes

### ❌ What Arika Auth Does NOT Do
- Authorization (policies / gates)
- User database or ORM management
- OAuth / social login (future scope)
- Session storage implementation (uses HTTP layer)

---

## Features

- **Request-scoped auth context**
  - Memory-safe, per-request isolation via `req.auth` — no leaks under concurrency.
- **Multiple authentication guards**
  - Configure different strategies for API vs Web (Session, JWT, Token, Basic).
- **Stateless JWT with Refresh Tokens**
  - Short-lived access tokens + rotating refresh tokens for modern APIs.
- **"Remember Me" support**
  - Persistent login across browser restarts with secure cookie rotation.
- **Email verification system**
  - Verify user emails with a simple API and `verified` middleware.
- **Password reset flow**
  - Token-based resets with expiry and hash-secured storage.
- **Account locking & throttling**
  - Soft lock after N failures, auto-unlock, manual unlock.
- **Auth event dispatching**
  - Hook into `Auth.Login`, `Auth.Failed`, `Auth.Lockout`, etc.
- **Pluggable user providers**
  - Connect to any database or ORM.
- **Secure password hashing**
  - Industry-standard hashing algorithms (Bcrypt/Argon2).

---

## Installation

```bash
npm install @arikajs/auth
# or
yarn add @arikajs/auth
# or
pnpm add @arikajs/auth
```

---

## 🧬 Authentication Flow

```
Request
  ↓
Authenticate Middleware  ← creates req.auth (AuthContext)
  ↓
AuthContext → Guard (Session / JWT / Token / Basic)
  ↓
User Provider
  ↓
Authenticated User (or reject)
```

---

## 🧩 Guards

Guards define how users are authenticated.

### Built-in Guards (v0.x)

| Guard | Description |
| :--- | :--- |
| `session` | Cookie/session-based authentication with "Remember Me" support |
| `jwt` | Stateless API authentication using JSON Web Tokens (JWT) |
| `token` | Header-based token authentication |
| `basic` | HTTP Basic Authentication support |

---

## 🧱 User Providers

User providers define how users are retrieved.

```ts
export interface UserProvider {
  retrieveById(id: string | number): Promise<any>;
  retrieveByToken?(id: string | number, token: string): Promise<any>;
  updateRememberToken?(user: any, token: string | null): Promise<void>;
  updateRefreshToken?(user: any, token: string | null): Promise<void>;
  retrieveByRefreshToken?(token: string): Promise<any>;
  retrieveByCredentials(credentials: Record<string, any>): Promise<any>;
  validateCredentials(user: any, credentials: Record<string, any>): boolean | Promise<boolean>;
}
```

Providers allow you to integrate any database or user store.

---

## 🔌 Basic Usage

### Checking Authentication State (per-request)

```ts
// In your controller — req.auth is automatically bound by the Authenticate middleware
if (await req.auth.check()) {
  const user = await req.auth.user();
}

// Or via the global facade (backed by AsyncLocalStorage):
import { auth } from '@arikajs/auth';
const user = await auth.user();
```

### Attempting Login

```ts
// The second parameter `true` enables "Remember Me"
const success = await auth.attempt({
  email: 'test@example.com',
  password: 'secret',
}, true);

if (!success) {
  throw new Error('Invalid credentials');
}
```

### Logging Out

```ts
await auth.logout();
```

---

## 🔒 Middleware Protection

### Protecting Routes

```ts
Route.get('/dashboard', handler)
  .middleware(['auth']);
```

### API Authentication

```ts
Route.get('/api/user', handler)
  .middleware(['auth:jwt']); // or auth:token, auth:basic
```

---

## 🚀 Advanced Features

### 🔒 Request-Scoped Auth Context (Critical for Concurrency)
Every incoming request gets its own isolated `AuthContext`. No shared mutable state, no memory leaks under concurrent load.
```ts
// The Authenticate middleware does this automatically:
const context = authManager.createContext(request);
// Now: req.auth.user(), req.auth.check(), req.auth.attempt() are all request-scoped
```

### 🔑 Stateless JWT with Refresh Tokens
Short-lived access tokens + secure refresh token rotation for modern API architectures:
```ts
// Login returns both tokens
const result = await req.auth.guard('jwt').attempt({ email, password });
// result = { access_token: 'eyJhbG...', refresh_token: '9f3a7b...' }

// Refresh when the access token expires
const newTokens = await jwtGuard.refresh(oldRefreshToken);
// Returns rotated access + refresh tokens
```

### 🍪 "Remember Me" Capability
Keep users logged in seamlessly across browser restarts using long-lived secure cookies.
```ts
await req.auth.attempt(credentials, true); // true = remember me
```

### ✉️ Email Verification System
Verify user emails with a simple API and protect routes that require verification:
```ts
// Send verification email
await req.auth.sendVerification(user);

// Protect routes requiring email verification
Route.get('/billing', handler)
  .middleware(['auth', 'verified']);
```

### 🔐 Password Reset Flow
Full token-based password reset with expiry and hash-secured storage:
```ts
import { PasswordResetBroker } from '@arikajs/auth';

const broker = new PasswordResetBroker(userProvider);

// Send reset link
const status = await broker.sendResetLink({ email: 'user@example.com' });

// Reset password with token
const result = await broker.reset(
  { email, token, password: newPassword },
  async (user, password) => {
    user.password = await Hasher.make(password);
    await user.save();
  }
);
```

### 🛡️ Account Locking Strategy
Soft lock accounts after too many failed attempts. Auto-unlock after configured duration. Manual unlock for admins.
```ts
// Check if account is locked
const locked = await req.auth.isLocked({ email });

// Manually unlock (e.g., admin action)
await req.auth.unlockAccount({ email });

// Configuration:
// { lockout: { maxAttempts: 5, decayMinutes: 15 } }
```

### 🛡️ Login Throttling (Rate Limiting)
ArikaJS Auth automatically integrates with RateLimiters to protect against brute-force attacks!
```ts
authManager.setRateLimiter(new RedisRateLimiter());
```

### 📡 Event Dispatching
ArikaJS fires core auth events so you can hook into the lifecycle:
- `Auth.Attempting` — login attempt started
- `Auth.Login` — successful login
- `Auth.Failed` — failed login attempt
- `Auth.Logout` — user logged out
- `Auth.Lockout` — account locked due to too many failures
- `Auth.VerificationSent` — verification email dispatched
- `Auth.AccountUnlocked` — account manually unlocked

---

## ⚙️ Configuration

Example configuration:

```ts
{
  default: 'session',
  guards: {
    session: { driver: 'session', provider: 'users' },
    jwt:     { driver: 'jwt',     provider: 'users', secret: 'your-jwt-secret', options: { expiresIn: '15m' } },
    token:   { driver: 'token',   provider: 'users' },
    basic:   { driver: 'basic',   provider: 'users' }
  },
  lockout: {
    maxAttempts: 5,
    decayMinutes: 15
  }
}
```

---

## 🔐 Password Hashing

```ts
import { Hasher } from '@arikajs/auth';

const hash = await Hasher.make('password');
const valid = await Hasher.check('password', hash);
```

Uses industry-standard hashing algorithms.

---

## 🏗 Architecture

```text
auth/
├── src/
│   ├── Contracts
│   │   ├── CanResetPassword.ts
│   │   ├── CanVerifyEmail.ts
│   │   ├── EventDispatcher.ts
│   │   ├── PasswordBroker.ts
│   │   ├── RateLimiter.ts
│   │   └── UserProvider.ts
│   ├── Guards
│   │   ├── BasicGuard.ts
│   │   ├── JwtGuard.ts
│   │   ├── SessionGuard.ts
│   │   └── TokenGuard.ts
│   ├── Middleware
│   │   ├── Authenticate.ts
│   │   └── EnsureEmailIsVerified.ts
│   ├── Passwords
│   │   └── PasswordResetBroker.ts
│   ├── AuthContext.ts
│   ├── AuthManager.ts
│   ├── Guard.ts
│   ├── Hasher.ts
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Versioning & Stability

- Current version: **v0.x** (experimental)
- API may change before **v1.0**
- Will follow semantic versioning after stabilization

---

## 📜 License

`@arikajs/auth` is open-sourced software licensed under the **MIT License**.

---

## 🧠 Philosophy

> “Authentication identifies the user. Authorization defines their power.”