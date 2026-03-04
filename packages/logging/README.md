## Arika Logging

`@arikajs/logging` provides a flexible, channel-based logging system for the ArikaJS framework.

It allows applications to write logs to multiple destinations (console, files, external services) using a unified API.

---

## ✨ Features

- **Multiple log channels**: Separate outputs for different needs
- **Driver-based architecture**: Pluggable backends (console, file, slack, etc.)
- **Log levels**: RFC 5424 compliant (emergency, alert, critical, error, warning, notice, info, debug)
- **Shared Context**: Set global metadata across all log entries
- **JSON Formatting**: Native support for structured logs
- **Stackable channels**: Combine multiple channels
- **File & console drivers**: Essential logging outputs
- **Slack integration**: Native webhook support for critical alerts
- **TypeScript-first**: Strongly typed interface

---

## 📦 Installation

```bash
npm install @arikajs/logging
# or
yarn add @arikajs/logging
# or
pnpm add @arikajs/logging
```

---

## 🚀 Basic Usage

```ts
import { Log } from '@arikajs/logging';

Log.info('Application started');
Log.error('Something went wrong', { userId: 1 });
```

Log.channel('daily').warning('Low disk space');
```

### 🎨 Formatting System

Arika Logging supports a pluggable formatting system. You can choose from built-in formatters or create your own.

**Available Formatters:**
- `json`: Structured JSON output (merges context into root)
- `pretty`: Colored text output for development
- `line` (or `text`): Standard plain text output

```ts
export default {
  channels: {
    // Production: Structured JSON for ELK/Datadog
    app: {
      driver: 'file',
      path: './logs/app.json',
      formatter: 'json',
    },

    // Development: Colored console output
    console: {
      driver: 'console',
      formatter: 'pretty',
    }
  }
}
```

**JSON Output Example:**
```json
{
  "timestamp": "2026-02-21T10:30:00Z",
  "level": "info",
  "message": "User logged in",
  "userId": 1,
  "ip": "127.0.0.1"
}
```

---

### 🧠 Shared Context

You can append context that will be included in every subsequent log entry for that logger.

```ts
Log.withContext({ traceId: 'req_123' });

Log.info('Processing order'); // Included traceId: req_123
Log.error('Order failed');    // Included traceId: req_123
```

---

## ⚙️ Configuration

```ts
export default {
  default: process.env.LOG_CHANNEL || 'stack',

  channels: {
    stack: {
      driver: 'stack',
      channels: ['single'],
    },

    single: {
      driver: 'file',
      path: './storage/logs/arika.log',
      level: process.env.LOG_LEVEL || 'debug',
    },

    daily: {
      driver: 'daily',
      path: './storage/logs/arika.log',
      level: process.env.LOG_LEVEL || 'debug',
      days: 14,
    },

    console: {
      driver: 'console',
      level: process.env.LOG_LEVEL || 'debug',
      formatter: 'json', // Use 'json' for structured logs
    },

    slack: {
      driver: 'slack',
      url: process.env.LOG_SLACK_WEBHOOK_URL,
      level: 'critical',
    },
  },
};
```

---

## 🔌 Supported Drivers (v1)

| Driver | Status | Description |
| :--- | :--- | :--- |
| **Console** | ✅ Supported | Standard output logging (Supports JSON) |
| **File** | ✅ Supported | Single file logging (Supports JSON) |
| **Daily** | ✅ Supported | Date-based rotating log files |
| **Stack** | ✅ Supported | Multi-channel composite logging |
| **Slack** | ✅ Supported | Critical alerts via Webhooks |
| Papertrail | ⏳ Planned | External service driver |

---

## 🔗 Integration

- **`@arikajs/http`** → request logs
- **`@arikajs/queue`** → job logs
- **`@arikajs/events`** → event logs
- **`@arikajs/auth`** → security logs

---

## 🏗 Architecture

```text
logging/
├── src/
│   ├── Contracts
│   │   ├── Formatter.ts
│   │   └── Logger.ts
│   ├── Drivers
│   │   ├── ConsoleDriver.ts
│   │   ├── DailyDriver.ts
│   │   ├── FileDriver.ts
│   │   └── SlackDriver.ts
│   ├── Formatters
│   │   ├── JsonFormatter.ts
│   │   └── LineFormatter.ts
│   ├── index.ts
│   ├── Logger.ts
│   └── LogManager.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 📄 License

`@arikajs/logging` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Logs tell the story your app can’t."
