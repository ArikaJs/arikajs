
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
import { SendEmailJob } from './Jobs/SendEmailJob';

// Basic dispatch
await Queue.dispatch(new SendEmailJob(user));

// Dispatch to specific connection & queue
await Queue.connection('redis')
  .push(new SendEmailJob(user).onQueue('high'));

// Delayed dispatching (10 seconds)
await Queue.later(10, new SendEmailJob(user));

// Or using chaining on the job
await Queue.dispatch(
  new SendEmailJob(user)
    .onDelay(60)
    .onQueue('emails')
);
```

### Defining a Job

Jobs should extend `BaseJob` to support method chaining.

```ts
import { BaseJob } from '@arikajs/queue';

export class SendEmailJob extends BaseJob {
  constructor(public user: any) {
    super();
  }

  async handle() {
    // job logic using this.user
  }
}
```

---

## 🏗 Running Workers

To start processing jobs, use the `queue:work` command:

```bash
# Process default queue on default connection
arika queue:work

# Process specific connection and queue
arika queue:work --connection=redis --queue=high

# Control sleep time when no jobs are found
arika queue:work --sleep=5
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
