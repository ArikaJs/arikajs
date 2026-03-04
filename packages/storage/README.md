## Arika Storage

`@arikajs/storage` is the filesystem abstraction layer for the ArikaJS framework.

It provides a clean, unified API to work with local and cloud-based storage systems using interchangeable drivers, designed for maximum developer experience but designed for Node.js and TypeScript.

This package allows ArikaJS applications to interact with files without caring where or how they are stored.

---

## ✨ Features

- **Multiple storage disks**: Configure different storage locations
- **Driver-based filesystem architecture**: Pluggable storage backends
- **Storage Extensibility**: Register custom drivers via `extend()`
- **Middleware pipelines**: Intercept operations via `disk().middleware()`
- **Local filesystem driver**: Built-in support for local file storage (v1)
- **Unified file API**: `put`, `get`, `delete`, `exists`, `url`, `copy`, `move`
- **File mutation API**: `append`, `prepend`
- **Buffer, string, and stream support**: Flexible content handling
- **Configuration-based disk resolution**: Easy setup via config files
- **TypeScript-first**: Full type safety with JavaScript compatibility
- **Designed for cloud drivers**: Ready for S3, GCS, Azure (S3 shipped)

---

## 📦 Installation

```bash
npm install @arikajs/storage
# or
yarn add @arikajs/storage
# or
pnpm add @arikajs/storage
```

---

## 🚀 Quick Start

### Basic File Operations

```ts
import { Storage } from '@arikajs/storage';

// Write a file
await Storage.put('files/example.txt', 'Hello Arika');

// Read a file
const content = await Storage.get('files/example.txt');

// Delete a file
await Storage.delete('files/example.txt');
```

---

## 💽 Working with Disks

Arika Storage supports multiple disks, each backed by a driver.

```ts
// Use a specific disk
await Storage.disk('local').put('notes.txt', 'Hello');

// Check if file exists on a disk
const exists = await Storage.disk('public').exists('image.png');
```

---

## ⚙️ Configuration

Storage disks are defined in your application configuration:

```ts
export default {
  default: 'local',

  disks: {
    local: {
      driver: 'local',
      root: './storage/app'
    },

    public: {
      driver: 'local',
      root: './storage/public',
      url: '/storage'
    }
  }
};
```

---

## 📁 Supported Drivers (v1)

| Driver | Status |
| :--- | :--- |
| Local filesystem | ✅ Supported |
| Amazon S3 | ✅ Supported |
| Google Cloud Storage | ✅ Supported |
| Azure Blob Storage | ✅ Supported |

---

## 📚 API Reference

### `Storage.put(path, contents)`

Write contents to a file.

```ts
await Storage.put('file.txt', 'content');
```

### `Storage.get(path)`

Read file contents.

```ts
const content = await Storage.get('file.txt');
```

**Throws** `FileNotFoundException` if the file does not exist.

### `Storage.exists(path)`

Check if a file exists.

```ts
const exists = await Storage.exists('file.txt');
```

### `Storage.delete(path)`

Delete a file.

```ts
await Storage.delete('file.txt');
```

### `Storage.copy(path, newPath)`

Copy a file to a new location.

```ts
await Storage.copy('file.txt', 'backup.txt');
```

### `Storage.move(path, newPath)`

Move a file to a new location.

```ts
await Storage.move('file.txt', 'archive.txt');
```

### `Storage.append(path, contents)`

Append contents to a file.

```ts
await Storage.append('log.txt', 'New log entry');
```

### `Storage.prepend(path, contents)`

Prepend contents to a file.

```ts
await Storage.prepend('log.txt', 'First entry');
```

### `Storage.url(path)`

Get the public URL for a file.

```ts
const url = Storage.url('image.png');
```

Returns a public URL if supported by the disk.

---

## 🏗 Architecture

```text
storage/
├── src/
│   ├── Contracts
│   │   └── Filesystem.ts
│   ├── Drivers
│   │   ├── AzureDriver.ts
│   │   ├── GCSDriver.ts
│   │   ├── LocalDriver.ts
│   │   └── S3Driver.ts
│   ├── Exceptions
│   │   └── FileNotFoundException.ts
│   ├── Disk.ts
│   ├── index.ts
│   └── StorageManager.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Extending Storage (Custom Drivers)

You can create your own storage driver:

```ts
import { Filesystem } from '@arikajs/storage';

class CustomDriver implements Filesystem {
  async put(path: string, contents: string | Buffer): Promise<void> {
    // Implementation
  }

  async get(path: string): Promise<Buffer> {
    // Implementation
  }

  async delete(path: string): Promise<void> {
    // Implementation
  }

  async exists(path: string): Promise<boolean> {
    // Implementation
  }

  url(path: string): string {
    // Implementation
  }
}
```

Register it inside `StorageManager` using the `extend()` method:
```ts
storage.extend('custom', (config) => new CustomDriver(config));
```

---

## 🚦 Storage Middleware

You can attach disk-level middleware to intercept any storage operations (e.g., logging every write, encrypting payloads on `.put()`, etc.).

```ts
storage.disk('local').middleware(async (data, next) => {
    if (data.operation === 'put') {
        console.log(`Writing file: ${data.path}`);
        // Optionally modify payload before saving!
        // data.contents = encrypt(data.contents);
    }
    return await next(data);
});
```

---

## 🔗 Integration with ArikaJS

`@arikajs/storage` integrates seamlessly with:

- **`@arikajs/auth`** → User uploads
- **`@arikajs/mail`** → Attachments
- **`@arikajs/logging`** → File logs
- **`@arikajs/queue`** → Temporary files
- **`@arikajs/view`** → Asset handling

---

## 🧪 Testing

The storage layer is fully testable by mocking drivers or using temporary disks.

---

## 🛣 Roadmap

- [x] S3 driver
- [x] GCS driver
- [x] Azure Blob driver
- [x] Streaming API
- [x] Temporary signed URLs
- [x] Disk-level middleware
- [x] File metadata support

---

## 📄 License

`@arikajs/storage` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Your application should care about files, not filesystems."
