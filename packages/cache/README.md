
## Arika Cache

`@arikajs/cache` provides a simple, fast, and driver-based caching system for the ArikaJS framework.

It allows applications to store frequently accessed data in memory or external stores to improve performance and reduce repeated computation or database queries.

---

## ✨ Features

- **Unified cache API**: Consistent interface across all drivers
- **Multiple cache stores**: Support for various storage backends
- **In-memory cache (v1)**: High-performance default storage
- **Bulk Operations (v2)**: Fetch or store multiple items in one network trip
- **Atomic Cache Locks (v2)**: Distributed locking for concurrency control
- **Cache Tags (v2)**: Logical grouping of cache keys for selective invalidation
- **TTL (time-to-live) support**: Automatic expiration of cached items
- **TypeScript-first design**: Strong typing for keys and values

---

## 📦 Installation

```bash
npm install @arikajs/cache
# or
yarn add @arikajs/cache
# or
pnpm add @arikajs/cache
```

---

## 🚀 Basic Usage

```ts
import { Cache } from '@arikajs/cache';

// Store a value for 60 seconds
await Cache.put('users.count', 150, 60);

// Retrieve a value
const count = await Cache.get('users.count');
```

### 🧹 Cache Helpers

```ts
// Get an item, or execute the callback and store the result if it doesn't exist
await Cache.remember('settings', 300, async () => {
  return loadSettings();
});
```

### 🏎️ Bulk Operations (High Performance)

Save network round-trips by fetching/storing multiple keys at once:

```ts
// Fetch multiple (Returns Record<string, any>)
const users = await Cache.getMultiple(['user:1', 'user:2', 'user:3']);

// Store multiple securely
await Cache.putMultiple({
  'user:1': data1,
  'user:2': data2
}, 60);

// Delete multiple
await Cache.forgetMultiple(['user:1', 'user:2']);
```

### 🏷️ Cache Tags (Selective Invalidation)

Group related cache entries using tags, so you can flush them together without affecting other cached data.

```ts
// Store items with tags
await Cache.tags(['users', 'admins']).put('user:1', userData, 3600);
await Cache.tags(['users']).put('user:2', userData, 3600);
await Cache.tags(['posts']).put('post:1', postData, 3600);

// Only flush items tagged with 'users' 
// ('post:1' remains perfectly intact!)
await Cache.tags(['users']).flush();
```

### 🔒 Atomic Cache Locks

Prevent race conditions and cache stampedes in distributed systems (like overlapping webhook processing or expensive queries).

```ts
const lock = Cache.lock('processing-invoice-123', 10); // lock for 10 seconds

if (await lock.acquire()) {
  try {
    // We hold the lock securely
    await processInvoice();
  } finally {
    await lock.release();
  }
}

// Alternatively, use the auto-releasing callback pattern:
await lock.get(async () => {
  // Executes only if acquired, and releases automatically
});

// Or seamlessly wait for a lock up to 5 seconds:
await lock.block(5, async () => {
  // Waits to acquire, then executes and releases natively
});
```

---

## ⚙️ Configuration

```ts
export default {
  default: process.env.CACHE_STORE || 'database',

  stores: {
    memory: {
      driver: 'memory',
    },

    database: {
      driver: 'database',
      table: 'cache',
      connection: null,
    },
  },

  prefix: process.env.CACHE_PREFIX || 'arika_cache',
};
```

---

| Driver | Status | Description |
| :--- | :--- | :--- |
| **Memory** | ✅ Supported | Default in-memory ephemeral storage |
| **Database** | ✅ Supported | Persistent cache using your database |
| **Redis** | ✅ Supported | High-performance distributed cache (Standalone, Sentinel, Cluster) |

---

## 🏎️ Redis Cache Setup

The Redis driver supports Standalone, Sentinel, and Cluster modes.

### 1. Install Redis Package

```bash
npm install ioredis
```

### 2. Configure Environment

Add Redis settings to your `.env` file:

```env
CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

### 3. Advanced Redis Configuration

ArikaJS supports Sentinel and Cluster modes. Configure these in `config/cache.ts`:

#### Sentinel Mode
```ts
redis: {
  driver: 'redis',
  connection: 'default',
  mode: 'sentinel',
  nodes: [
    { host: '127.0.0.1', port: 26379 },
    { host: '127.0.0.1', port: 26380 },
  ],
  name: 'mymaster',
},
```

#### Cluster Mode
```ts
redis: {
  driver: 'redis',
  mode: 'cluster',
  nodes: [
    { host: '127.0.0.1', port: 7000 },
    { host: '127.0.0.1', port: 7001 },
  ],
},
```

---

## 🛠 Database Cache Setup

To use the database driver, you need to create the `cache` table migration:

```bash
arika cache:table
arika migrate
```

---

## 🔗 Integration

- **`@arikajs/http`** → response caching
- **`@arikajs/view`** → view fragments
- **`@arikajs/queue`** → cached jobs
- **`@arikajs/auth`** → session storage

---

## 🏗 Architecture

```text
cache/
├── src/
│   ├── Contracts
│   │   └── Store.ts
│   ├── Drivers
│   │   ├── DatabaseDriver.ts
│   │   ├── MemoryDriver.ts
│   │   └── RedisDriver.ts
│   ├── CacheLock.ts
│   ├── CacheManager.ts
│   ├── index.ts
│   ├── Repository.ts
│   ├── TaggedStore.ts
│   └── TagSet.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/cache` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Fast data wins."
