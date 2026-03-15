## Arika Session

`@arikajs/session` provides a powerful, secure, and driver-based session management system for the ArikaJS framework.

It answers one critical question: **"How do we persist user state across requests?"**

```ts
req.session.set('user_id', 42);
req.session.get('user_id'); // 42
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope**:
  - Driver-based session storage (file, memory, redis, database)
  - Flash session data (one-request messages)
  - Cookie-based session identifiers
  - Automatic session lifecycle middleware
  - Session regeneration for security
  - Lazy session loading
  - Write optimization
  - Session locking for concurrency protection

- **Design**:
  - Framework-agnostic session manager
  - Pluggable storage drivers
  - Middleware-driven lifecycle
  - Config-driven architecture
  - Environment variable support

---

## ✨ Purpose

HTTP is stateless by design.
Sessions provide a mechanism to persist data across requests.

Typical use cases include:
- Authentication state
- Flash messages
- Shopping carts
- CSRF tokens
- Multi-step forms
- User preferences

`@arikajs/session` provides a centralized and scalable session system for modern Node.js applications.

---

## 🚀 Features

- **Driver-based storage** — Switch between file, memory, Redis, or database drivers.
- **Flash session support** — Store temporary messages for the next request.
- **Automatic middleware lifecycle** — Sessions start and persist automatically.
- **Cookie-based session IDs** — Lightweight and secure.
- **Session locking** — Prevent race conditions in concurrent requests.
- **Lazy session loading** — Sessions load only when accessed.
- **Write optimization** — Avoid unnecessary storage writes.
- **Session regeneration** — Protect against session fixation attacks.
- **Environment configuration** — Configure using `.env`.

---

## 📦 Installation

```bash
npm install @arikajs/session
```

---

## 🧠 Core Concepts

### 1️⃣ Sessions

A session is a key-value store associated with a user request.

```ts
req.session.set('name', 'Prakash');
req.session.set('role', 'admin');

req.session.get('name'); // "Prakash"
```

Session data persists between requests using a session ID stored in cookies.

### 2️⃣ Flash Data

Flash data exists for one request only.
Commonly used for UI notifications such as login success messages.

```ts
req.session.flash('success', 'Login successful');
```

Next request:
```ts
req.session.get('success'); // "Login successful"
```
After the response completes, the flash data is automatically removed.

### 3️⃣ Session Regeneration

Session IDs should be regenerated after authentication.

```ts
await req.session.regenerate();
```
This prevents session fixation attacks.

---

## ⚙️ Configuration

Sessions are configured via `config/session.ts`.

```ts
export default {
  driver: process.env.SESSION_DRIVER || 'file',
  lifetime: Number(process.env.SESSION_LIFETIME) || 120,
  cookie: process.env.SESSION_COOKIE || 'arika_session',
  path: process.env.SESSION_PATH || './storage/sessions',
  secure: false,
  httpOnly: true,
  locking: true,
  lockTimeout: 10
};
```

### Environment Variables

```env
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_COOKIE=arika_session
SESSION_PATH=./storage/sessions
SESSION_LOCKING=true
```

---

## 🧩 Middleware Support

Sessions are automatically initialized via middleware.

```ts
import { StartSession } from '@arikajs/session';

app.use(StartSession);
```

The middleware:
1. Reads session ID from cookies
2. Loads session data from the configured driver
3. Attaches session to the request
4. Persists changes after response

---

## 🗂 Session API

**Set Value**
```ts
req.session.set('cart_items', 3);
```

**Get Value**
```ts
req.session.get('cart_items');
```

**Check Existence**
```ts
req.session.has('cart_items');
```

**Remove Value**
```ts
req.session.forget('cart_items');
```

**Destroy Session**
```ts
await req.session.destroy();
```

---

## 💾 Storage Drivers

`@arikajs/session` supports multiple storage drivers.

| Driver | Description |
| :--- | :--- |
| `memory` | In-memory storage (development only) |
| `file` | Filesystem-based sessions |
| `redis` | Redis distributed session storage |
| `database` | SQL-based session storage |

Example configuration:
```ts
export default {
  driver: 'redis'
}
```

Drivers implement a common interface:
```ts
interface SessionDriver {
  load(sessionId: string): Promise<any>;
  save(sessionId: string, data: any): Promise<void>;
  destroy(sessionId: string): Promise<void>;
}
```

---

## 🔐 Session Locking (Concurrency Protection)

Modern applications may issue multiple concurrent requests from the same user.

Example:
```text
Browser
 ├─ Request A → update-profile
 └─ Request B → add-to-cart
```
Without protection, both requests may overwrite session data.

Session locking ensures:
1. Request A → acquires lock
2. Request B → waits
3. Request A → releases lock
4. Request B → proceeds

Configuration:
```ts
export default {
  locking: true,
  lockTimeout: 10
}
```

Recommended drivers:

| Driver | Locking Support |
| :--- | :--- |
| Redis | Excellent |
| Database | Good |
| File | Basic |
| Memory | Not recommended |

---

## ⚡ Lazy Session Loading

Sessions load only when accessed.

Example:
```ts
GET /health → session NOT loaded
GET /dashboard → session loaded
req.session.get('user_id');
```

Benefits:
- Reduced I/O
- Faster responses
- Lower memory usage

---

## 🧾 Write Optimization

Session storage writes occur only when data changes.

Example:
```text
Request → session accessed
        → no changes
        → skip write
```

But when modified:
```ts
req.session.set('cart', items)
```
Then storage write occurs.

Benefits:
- Reduced Redis calls
- Reduced disk writes
- Better scalability

---

## 🧠 Automatic Garbage Collection

Expired sessions must be periodically cleaned.

Example strategies:

| Driver | Cleanup |
| :--- | :--- |
| File | Directory cleanup |
| Redis | Native TTL |
| Database | Scheduled cleanup |

Configuration:
```ts
export default {
  gcProbability: 0.01
}
```
Meaning 1% of requests trigger cleanup.

---

## 🔁 Session ID Rotation

Session IDs can be rotated for additional security.

```ts
await req.session.regenerate();
```

Use cases:
- After login
- After role escalation
- After sensitive actions

---

## 🧩 Custom Drivers

Developers can implement custom session drivers.

```ts
class MongoSessionDriver {
  async load(id) { }
  async save(id, data) { }
  async destroy(id) { }
}
```

Register driver:
```ts
SessionManager.extend('mongo', () => new MongoSessionDriver());
```

---

## ⚡ Performance

`@arikajs/session` is optimized for high-throughput applications.

- Lazy session loading
- Mutation-based writes
- Efficient cookie parsing
- Driver abstraction
- Request lifecycle integration

---

## 🏗 Architecture

```text
session/
├── src/
│   ├── Contracts
│   │   └── SessionDriver.ts
│   ├── Drivers
│   │   ├── FileDriver.ts
│   │   ├── MemoryDriver.ts
│   │   ├── RedisDriver.ts
│   │   └── DatabaseDriver.ts
│   ├── Middleware
│   │   └── StartSession.ts
│   ├── Session.ts
│   ├── SessionManager.ts
│   ├── CookieSessionId.ts
│   ├── index.ts
│   └── utils.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Integration with ArikaJS

| Package | Responsibility |
| :--- | :--- |
| `@arikajs/http` | Request & response lifecycle |
| `@arikajs/router` | Route matching |
| `@arikajs/session` | Session state management |
| `@arikajs/auth` | Authentication |
| `@arikajs/authorization` | Access control |

---

## 📌 Design Philosophy

- **Stateless by default** — Sessions only when needed.
- **Driver abstraction** — Swap storage without changing code.
- **Security-first** — Built-in protection against fixation attacks.
- **Performance-focused** — Lazy loading and write optimization.
- **Framework-aligned** — Works seamlessly with ArikaJS middleware lifecycle.

> "Sessions maintain continuity in a stateless world."

---

## 🔄 Versioning & Stability

- Current version: **v0.x** (Experimental)
- APIs may change until **v1.0**
- Semantic versioning will be adopted after stabilization.

---

## 📜 License

`@arikajs/session` is open-sourced software licensed under the **MIT License**.
