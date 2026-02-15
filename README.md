# ArikaJS

<div align="center">

![ArikaJS Logo](https://via.placeholder.com/200x200?text=ArikaJS)

**A Modern, Elegant Web Framework for Node.js**

[![npm version](https://img.shields.io/npm/v/arikajs.svg)](https://www.npmjs.com/package/arikajs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

[Quick Start](#quick-start) | [Examples](https://github.com/arikajs/examples) | [Community](https://discord.gg/arikajs)

</div>

---

## 🚀 What is ArikaJS?

ArikaJS is a **modern, elegant, and powerful** Node.js framework that brings enterprise-grade features and developer-friendly patterns to the TypeScript/JavaScript ecosystem. Built from the ground up with TypeScript, ArikaJS provides a robust foundation for building scalable web applications and APIs with an intuitive, expressive syntax.

### ✨ Key Features

- 🎯 **Elegant Syntax** - Clean, expressive code that's a joy to write
- 🔥 **TypeScript First** - Full TypeScript support with excellent type inference
- 🛣️ **Powerful Routing** - Intuitive routing with implicit model binding
- 💉 **Dependency Injection** - Built-in IoC container for clean architecture
- 🗄️ **Active Record ORM** - Eloquent-inspired database layer
- 🔐 **Authentication & Authorization** - Built-in auth system with guards and policies
- ✅ **Validation** - Comprehensive request validation
- 📧 **Mail & Notifications** - Easy email and notification system
- 🔄 **Queue System** - Background job processing
- 📦 **Service Providers** - Modular application architecture
- 🎨 **Template Engine** - Flexible view rendering
- 🧪 **Testing Ready** - Built with testing in mind

---

## 📦 Installation

### Quick Start with CLI

The fastest way to get started is using the ArikaJS CLI:

```bash
# Install the CLI globally
npm install -g @arikajs/cli

# Create a new project
arika new my-app

# Navigate to your project
cd my-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Your application will be running at `http://localhost:8000` 🎉

### Manual Installation

```bash
# Create a new project directory
mkdir my-app && cd my-app

# Initialize npm
npm init -y

# Install ArikaJS
npm install arikajs

# Install dev dependencies
npm install -D @arikajs/cli typescript tsx @types/node
```

---

## 🏗️ Project Structure

```
my-app/
├── app/
│   ├── Controllers/       # HTTP controllers
│   ├── Models/           # Database models
│   ├── Middleware/       # Custom middleware
│   └── Http/
│       └── Kernel.ts     # HTTP kernel configuration
├── bootstrap/
│   └── app.ts           # Application bootstrap
├── config/              # Configuration files
│   ├── app.ts
│   ├── database.ts
│   └── logging.ts
├── database/
│   └── migrations/      # Database migrations
├── routes/
│   └── web.ts          # Route definitions
├── server.ts           # Application entry point
├── .env                # Environment variables
└── package.json
```

---

## 📚 Basic Usage

### Routing

Define routes with an elegant, expressive syntax:

```typescript
import { Route } from 'arikajs';

// Simple route
Route.get('/', () => {
    return { message: 'Welcome to ArikaJS!' };
});

// Route with parameters
Route.get('/users/{id}', (request, id) => {
    return { userId: id };
});

// Route groups with middleware
Route.group({ middleware: 'auth' }, () => {
    Route.get('/dashboard', [DashboardController, 'index']);
    Route.post('/posts', [PostController, 'store']);
});
```

### Implicit Model Binding

Automatically resolve models from route parameters:

```typescript
import { Route } from 'arikajs';
import User from './app/Models/User';

// Register model binding
Route.model('user', User);

// The {user} parameter will automatically resolve to a User instance
Route.get('/users/{user}', (request, user: User) => {
    return {
        message: 'User found!',
        user: user
    };
});
```

### Controllers

Create clean, organized controllers:

```typescript
import { Request, Response } from 'arikajs';
import User from '../Models/User';

export class UserController {
    async index(request: Request, response: Response) {
        const users = await User.all();
        return response.json(users);
    }

    async show(request: Request, response: Response) {
        const user = await User.findOrFail(request.params.id);
        return response.json(user);
    }

    async store(request: Request, response: Response) {
        const user = await User.create(request.body);
        return response.status(201).json(user);
    }
}
```

### Models (Active Record)

Work with databases using an elegant ORM:

```typescript
import { Model } from 'arikajs';

export default class User extends Model {
    protected static tableName = 'users';

    // Define relationships
    posts() {
        return this.hasMany(Post);
    }

    // Custom methods
    async sendWelcomeEmail() {
        // Send email logic
    }
}

// Usage
const user = await User.find(1);
const posts = await user.posts().get();

const newUser = await User.create({
    name: 'John Doe',
    email: 'john@example.com'
});
```

### Middleware

Create custom middleware for request processing:

```typescript
import { MiddlewareHandler, Request, Response } from 'arikajs';

export default class AuthMiddleware implements MiddlewareHandler {
    async handle(request: Request, response: Response, next: Function) {
        if (!request.headers.authorization) {
            return response.status(401).json({ error: 'Unauthorized' });
        }

        return next();
    }
}
```

### Service Providers

Organize your application with service providers:

```typescript
import { ServiceProvider } from 'arikajs';
import { PaymentService } from './Services/PaymentService';

export class PaymentServiceProvider extends ServiceProvider {
    async register() {
        this.app.singleton('payment', () => {
            return new PaymentService(this.app.config().get('payment'));
        });
    }

    async boot() {
        // Bootstrap logic
    }
}
```

### Database Migrations

Manage your database schema with migrations:

```typescript
import { Migration, SchemaBuilder } from 'arikajs';

export default class CreateUsersTable extends Migration {
    async up(schema: SchemaBuilder) {
        await schema.create('users', (table) => {
            table.increments('id');
            table.string('name');
            table.string('email').unique();
            table.string('password');
            table.timestamps();
        });
    }

    async down(schema: SchemaBuilder) {
        await schema.dropIfExists('users');
    }
}
```

---

## 🔧 Configuration

Configure your application in the `config/` directory:

**config/app.ts**
```typescript
export default {
    name: process.env.APP_NAME || 'ArikaJS',
    env: process.env.NODE_ENV || 'development',
    key: process.env.APP_KEY,
    timezone: 'UTC',
};
```

**config/database.ts**
```typescript
export default {
    default: 'mysql',
    connections: {
        mysql: {
            driver: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            database: process.env.DB_DATABASE,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
        },
    },
};
```

---

## 🎨 CLI Commands

ArikaJS comes with a powerful CLI for common tasks:

```bash
# Create a new application
arika new my-app

# Start development server
arika serve --dev

# Generate application key
arika key:generate

# Database migrations
arika migrate
arika migrate:rollback

# Create migration
arika make:migration create_posts_table
```

---

## 🧪 Testing

ArikaJS is built with testing in mind:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import app from './bootstrap/app';

describe('User API', () => {
    it('should return all users', async () => {
        const response = await app.get('/api/users');
        assert.strictEqual(response.status, 200);
    });
});
```

---

## 📖 Documentation

Comprehensive documentation is available in the [GitHub repository](https://github.com/arikajs/arikajs).

For guides and examples, check out:
- [Installation Guide](https://github.com/arikajs/arikajs#installation)
- [Routing](https://github.com/arikajs/arikajs#routing)
- [Controllers](https://github.com/arikajs/arikajs#controllers)
- [Database & ORM](https://github.com/arikajs/arikajs#models-active-record)
- [Examples](https://github.com/arikajs/examples)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/arikajs/arikajs.git

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

---

## 📝 License

ArikaJS is open-sourced software licensed under the [MIT license](LICENSE).

---

## 🙏 Acknowledgments

ArikaJS draws inspiration from the best practices and patterns of modern web frameworks, including elegant API design, developer experience focus, and enterprise-grade architecture.

---

## 💬 Community & Support

- 📖 [Documentation](https://github.com/arikajs/arikajs#readme)
- 💬 [Discord Community](https://discord.gg/arikajs)
- 🐦 [Twitter](https://twitter.com/arikajs)
- 🐛 [Issue Tracker](https://github.com/arikajs/arikajs/issues)

---

<div align="center">

**Built with ❤️ by the ArikaJS Team**

[GitHub](https://github.com/arikajs) • [npm](https://www.npmjs.com/package/arikajs)

</div>
