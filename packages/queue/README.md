
## Arika Queue

`@arikajs/queue` provides asynchronous job processing for the ArikaJS framework.

It allows applications to defer heavy or time-consuming tasks — such as emails, notifications, or event listeners — to background workers, improving performance and scalability.

---

## ✨ Features

- **Job dispatching**: Easily send tasks to the queue
- **Background job workers**: Processes jobs offline
- **Sync & async queue drivers**: Flexible processing modes
- **Redis-based queue driver (v1)**: Robust, scalable backend support
- **Queueable events & mail**: Integration with other framework components
- **Automatic retry handling**: Resilient job execution
- **TypeScript-first design**: Fully typed API

---

## 📦 Installation

```bash
npm install @arikajs/queue
# or
yarn add @arikajs/queue
# or
pnpm add @arikajs/queue
```

---

## 🚀 Basic Usage

### Dispatching a Job

```ts
import { Queue } from '@arikajs/queue';

await Queue.dispatch(new SendEmailJob(user));
```

### Defining a Job

```ts
export class SendEmailJob {
  async handle() {
    // job logic
  }
}
```

---

## 🔁 Queue Drivers (v1)

| Driver | Status | Description |
| :--- | :--- | :--- |
| **Sync** | ✅ Supported | Default synchronous driver for local dev |
| **Database** | ✅ Supported | Stores jobs in your database |
| **Redis** | ✅ Supported | Redis-based queue driver (High-performance) |

---

## ⚙️ Configuration

```ts
export default {
  default: process.env.QUEUE_CONNECTION || 'sync',

  connections: {
    sync: {
      driver: 'sync',
    },

    database: {
      driver: 'database',
      table: 'jobs',
      connection: null,
    },
  },
};
```

---

## 🛠 Database Queue Setup

To use the database driver, you need to create the `jobs` table migration:

```bash
arika queue:table
arika migrate
```

---

## 🔗 Integration

- **`@arikajs/mail`** → queued emails
- **`@arikajs/events`** → async listeners
- **`@arikajs/logging`** → job logs
- **`@arikajs/console`** → worker commands

---

## 🏗 Architecture

```text
queue/
├── src/
│   ├── Drivers
│   │   ├── DatabaseDriver.ts
│   │   ├── RedisDriver.ts
│   │   └── SyncDriver.ts
│   ├── Contracts.ts
│   ├── index.ts
│   ├── Job.ts
│   ├── QueueManager.ts
│   └── Worker.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/queue` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Fast requests. Slow work in the background."
