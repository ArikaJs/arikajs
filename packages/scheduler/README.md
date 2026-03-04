
## Arika Scheduler

`@arikajs/scheduler` provides a clean, expressive, and framework-integrated task scheduling system for the ArikaJS ecosystem.

It allows you to define scheduled jobs directly in code using a fluent API — designed for elegance and clarity — while remaining lightweight and Node.js-native.

The scheduler is designed to work seamlessly with `@arikajs/foundation`, `@arikajs/queue`, and `@arikajs/logging`.

---

## ✨ Features

- **🕒 Fluent scheduling API**: Expressive and readable schedule definitions
- **⚡ Parallel Execution**: Non-blocking task execution for high performance
- **🏆 Cluster Safety**: Leader election prevents double-execution in distributed environments
- **🔁 Cron-based scheduling**: Full support for standard cron expressions
- **⏱ Human-readable intervals**: Preset methods like `everyMinute()`, `hourly()`, `daily()`
- **🧵 Queue integration**: Dispatch jobs directly to the background instead of blocking
- **🪵 Logging integration**: Automatically logs task starts, completions, and failures
- **🛡️ Task Control**: Built-in support for timeouts and automatic retries
- **📡 Lifecycle Events**: Real-time monitoring via `@arikajs/events`
- **🌍 Timezone support**: Run tasks relative to your preferred global or local timezone
- **🛑 Graceful Shutdown**: Safe worker termination without dropping tasks
- **🟦 TypeScript-first**: Full type safety for all scheduling operations

---

## 📦 Installation

```bash
npm install @arikajs/scheduler
```

**Requires:**
- `@arikajs/foundation`
- `@arikajs/logging`
- `@arikajs/cache` (recommended for overlapping & cluster locks)
- `@arikajs/events` (optional, for monitoring)

---

## 🚀 Quick Start

### 1️⃣ Define Scheduled Tasks

Create a scheduler definition file (e.g., `app/Console/Kernel.ts`):

```ts
import { Schedule } from '@arikajs/scheduler';

export default (schedule: Schedule) => {
  // Run a closure every minute with a name
  schedule.call(() => {
    console.log('Running every minute');
  }).everyMinute().name('important-sync');

  // Run a CLI command daily with timeout and retries
  schedule.command('app:cleanup')
    .daily()
    .timeout(60) // 1 minute timeout
    .retry(3, 10); // retry 3 times with 10s delay

  // Dispatch a job to the queue hourly
  schedule.job(CleanupJob).hourly();
};
```

### 2️⃣ Run the Scheduler

You can run the scheduler in two modes:

**Long-running Daemon (Recommended for Production)**
```bash
arika schedule:work
```

**Single Run (For Cron Jobs)**
```bash
* * * * * cd /path-to-your-project && node artisan schedule:run >> /dev/null 2>&1
```

---

## 📅 Defining Tasks

### 🔁 Run a Closure
```ts
schedule.call(async () => {
  await db.table('users').where('active', false).delete();
}).everyMinute();
```

### 🧾 Run a Command
```ts
schedule.command('cache:clear').dailyAt('02:00');
```

---

## 🛡 Advanced Usage

### Parallel Execution & Leader Election
The scheduler automatically runs all due tasks in parallel so complex tasks don't block simple ones. 

In a clustered environment (multiple servers/containers), the scheduler uses `@arikajs/cache` to perform **Leader Election**. Only one server will process the schedule for any given minute, ensuring safety without extra configuration.

### Preventing Overlaps
If a specific task should not start if its previous instance is still active:
```ts
schedule
  .command('report:generate')
  .everyMinute()
  .withoutOverlapping();
```

### Timezone & Retries
```ts
schedule
  .command('backup:run')
  .dailyAt('01:00')
  .timezone('Asia/Kolkata')
  .retry(3, 30); // Retry 3 times with 30s delay between attempts
```

### Monitoring via Events
The scheduler emits events that you can listen to in your `EventsServiceProvider`:
- `scheduler.TaskStarting`
- `scheduler.TaskFinished
- `scheduler.TaskFailed`

```ts
Event.listen('scheduler.TaskFailed', (data) => {
    Log.error(`CRITICAL: Task ${data.task} failed! Error: ${data.err.message}`);
});
```

---

## 🏗 Architecture

```text
scheduler/
├── src/
│   ├── Contracts
│   │   └── Task.ts
│   ├── Mutex
│   ├── Event.ts
│   ├── index.ts
│   ├── Schedule.ts
│   ├── Scheduler.ts
│   └── Worker.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/scheduler` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "If it must run, it must run reliably."
