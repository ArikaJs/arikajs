
## Arika Cache

`@arikajs/cache` provides a simple, fast, and driver-based caching system for the ArikaJS framework.

It allows applications to store frequently accessed data in memory, files, or external stores to improve performance and reduce repeated computation or database queries.

---

## ✨ Features

- **Unified cache API**: Consistent interface across all drivers
- **Multiple cache stores**: Support for various storage backends
- **File-based cache (Default)**: Persistent storage without external dependencies
- **Bulk Operations**: Fetch or store multiple items in one network trip
- **Atomic Cache Locks**: Distributed locking for concurrency control
- **Cache Tags**: Logical grouping of cache keys for selective invalidation
- **TTL (time-to-live) support**: Automatic expiration of cached items
- **TypeScript-first design**: Strong typing for keys and values

---

## 📦 Installation

```bash
npm install @arikajs/cache
```

---

## 🚀 Basic Usage

```ts
import { Cache } from 'arikajs';

// Store a value for 60 seconds
await Cache.put('users.count', 150, 60);

// Retrieve a value
const count = await Cache.get('users.count');

// Remove an item
await Cache.forget('users.count');

// Clear all cache
await Cache.flush();
```

---

## 🏎️ Drivers

| Driver | Status | Description |
| :--- | :--- | :--- |
| **File** | ✅ Default | Persistent local storage (stores in `storage/cache/data`) |
| **Memory** | ✅ Supported | High-performance ephemeral in-memory storage |
| **Database** | ✅ Supported | Persistent cache using your database (MySQL/PostgreSQL) |
| **Redis** | ✅ Supported | Distributed cache (Standalone, Sentinel, Cluster) |

---

## 📂 File Cache (Default)

The `file` driver is the default cache store. It stores data in your application's file system, typically under `storage/cache/data`.

### Configuration in `config/cache.ts`:

```ts
export default {
  default: process.env.CACHE_STORE || 'file',

  stores: {
    file: {
        driver: 'file',
        path: 'storage/cache/data',
    },
    // ...
  }
}
```

---

## 🛠 Cache Commands

ArikaJS CLI provides several commands to manage your cache:

### Clear Cache
Flush the entire application cache (or a specific store):
```bash
arika cache:clear
arika cache:clear redis
```

### Setup Database Cache
If you want to use the `database` driver, you must create the cache table:
```bash
arika cache:table
arika migrate
```

---

## 🏎️ Redis Cache Setup

### 1. Install Redis Package
```bash
npm install ioredis
```

### 2. Configure Environment
```env
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
```

---

## 🔒 Atomic Cache Locks

Prevent race conditions by using atomic locks:

```ts
const lock = Cache.lock('processing-invoice-123', 10);

if (await lock.acquire()) {
  try {
    // Critical section
  } finally {
    await lock.release();
  }
}
```

---

## 📄 License

`@arikajs/cache` is open-source software licensed under the **MIT License**.
