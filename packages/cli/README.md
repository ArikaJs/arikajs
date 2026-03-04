# @arikajs/cli

<div align="center">

<img src="./templates/app/public/assets/img/logo.png" alt="ArikaJS Logo" width="400">

**The Official Command-Line Interface for ArikaJS**

[![npm version](https://img.shields.io/npm/v/@arikajs/cli.svg)](https://www.npmjs.com/package/@arikajs/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📦 Installation & Usage

### Option 1: Use with `npx` (Recommended)

The fastest way to use the ArikaJS CLI without installing it globally:

```bash
npx @arikajs/cli new my-app
```

### Option 2: Global Installation

Install the CLI globally to use the `arika` command anywhere:

```bash
npm install -g @arikajs/cli

# Then use directly:
arika new my-app
```

---

## 🚀 Quick Start

Create a new ArikaJS application:

```bash
# Create a new project
arika new my-awesome-app

# Navigate to your project
cd my-awesome-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Your application will be running at `http://localhost:8000` 🎉

---

## 📋 Available Commands

### `arika new <name>`

Create a new ArikaJS application.

```bash
arika new my-app
```

**Options:**
- `<name>` - The name of your application

**Interactive Prompts:**
- Install dependencies automatically? (Y/n)

**What it does:**
- Creates a new directory with your app name
- Scaffolds the complete application structure
- Sets up configuration files
- Generates a secure application key
- Optionally installs npm dependencies

---

### `arika serve`

Start the development server.

```bash
# Start in development mode with hot-reload
arika serve --dev

# Start in production mode
arika serve
```

**Options:**
- `--dev` - Run with TypeScript hot-reload using tsx
- `--port <port>` - Specify the port (default: from .env or 8000)

---

### `arika key:generate`

Generate a new application encryption key.

```bash
arika key:generate
```

**What it does:**
- Generates a secure random 32-character key
- Updates your `.env` file with `APP_KEY`
- Required for encryption, sessions, and security features

---

### `arika migrate`

Run database migrations.

```bash
# Run all pending migrations
arika migrate

# Rollback the last batch of migrations
arika migrate:rollback

# Rollback all migrations
arika migrate:reset

# Rollback and re-run all migrations
arika migrate:refresh
```

---

### `arika make:migration <name>`

Create a new database migration.

```bash
arika make:migration create_users_table
```

**What it does:**
- Creates a new migration file in `database/migrations/`
- Includes timestamp prefix for ordering
- Provides template with `up()` and `down()` methods

**Example output:**
```
database/migrations/0001_create_users_table.ts
```

---

### Code Generators (`make:*`)

Scaffold boilerplate code quickly to speed up development.

```bash
# Controllers
arika make:controller UserController

# Models, Controllers & Migrations
arika make:model User
arika make:model User --migration  # Creates User model + 'users' migration
arika make:model User --controller # Creates User model + UserController
arika make:model User --mc         # Creates Model + Migration + Controller

# Middleware
arika make:middleware AuthMiddleware

# Service Providers
arika make:provider PaymentServiceProvider

# Artisan Commands
arika make:command SendReport      # Generates 'send:report' command

# Events & Listeners
arika make:event UserRegistered
arika make:listener SendWelcomeEmail

# Background Jobs
arika make:job ProcessPayment
```

**Smart Features:**
- `-m` / `--migration` : Also scaffolds a matching table migration.
- `-c` / `--controller` : Also scaffolds a matching controller.
- `--mc` : Scaffolds a model, migration, and controller all at once.

### Authentication Scaffolding

ArikaJS includes a powerful, single-command scaffolding tool to get an authentication system up and running instantly.

```bash
arika auth:install
```

This command automatically publishes the following boilerplate into your project:
- A `config/auth.ts` configuration file
- An Eloquent `User.ts` model
- A database migration for the `users` table
- An `AuthController.ts` with complete `register`, `login`, and `me` flows.
- An `AuthMiddleware.ts` to protect routes
- It also safely appends the corresponding authentication endpoints to your `routes/api.ts` file!

---

### `arika queue:table`

Create the database table for queue jobs.

```bash
arika queue:table
```

**What it does:**
- Creates a migration for the `jobs` table
- Sets up the schema for background job processing

---

When you create a new project with `arika new`, you get this structure:

```
my-app/
├── app/
│   ├── Controllers/          # HTTP controllers
│   ├── Models/              # Database models
│   ├── Middleware/          # Custom middleware
│   └── Http/
│       └── Kernel.ts        # HTTP kernel configuration
├── bootstrap/
│   └── app.ts              # Application bootstrap
├── config/                  # Configuration files
│   ├── app.ts
│   ├── database.ts
│   └── logging.ts
├── database/
│   └── migrations/         # Database migrations
├── routes/
│   └── web.ts             # Route definitions
├── .env                    # Environment variables
├── .env.example           # Environment template
├── server.ts              # Application entry point
├── tsconfig.json          # TypeScript configuration
└── package.json           # npm dependencies
```

---

## 🔧 Configuration

The CLI respects your project's configuration:

### Environment Variables

Create a `.env` file in your project root:

```env
APP_NAME=MyApp
APP_ENV=development
APP_KEY=your-32-character-secret-key
APP_PORT=8000

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=root
DB_PASSWORD=secret
```

### TypeScript Configuration

The generated `tsconfig.json` is optimized for ArikaJS:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 🎯 Usage Examples

### Creating a New Project

```bash
# Create a new project
$ arika new blog-api

🚀 Creating a new ArikaJS application: /path/to/blog-api

? Would you like to install dependencies automatically? Yes

Scaffolding project in /path/to/blog-api...
Installing dependencies...

✨ Project created successfully!

Next steps:
  cd blog-api
  npm run dev

Happy coding with ArikaJS!
```

### Starting Development Server

```bash
$ cd blog-api
$ arika serve --dev

Starting ArikaJS development server...
Using tsx to run TypeScript server with hot-reload...
🚀 Starting ArikaJS application...
[2026-02-15 19:00:00] INFO: ArikaJS application listening on http://localhost:8000
```

### Running Migrations

```bash
# Create a migration
$ arika make:migration create_posts_table
✅ Created migration: database/migrations/0001_create_posts_table.ts

# Run migrations
$ arika migrate
Migrating: 0001_create_posts_table
Migrated:  0001_create_posts_table
```

---

## 🛠️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/arikajs/arikajs/tree/main/packages/cli#readme
cd cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link for local development
npm link
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 📚 Related Packages

The CLI works seamlessly with the ArikaJS ecosystem:

- [`arikajs`](https://www.npmjs.com/package/arikajs) - Core framework
- [`@arikajs/router`](https://www.npmjs.com/package/@arikajs/router) - Routing system
- [`@arikajs/database`](https://www.npmjs.com/package/@arikajs/database) - Database ORM
- [`@arikajs/auth`](https://www.npmjs.com/package/@arikajs/auth) - Authentication
- [`@arikajs/validation`](https://www.npmjs.com/package/@arikajs/validation) - Validation

---

## 🏗 Architecture

```text
cli/
├── src/
│   ├── Commands
│   │   ├── CacheTableCommand.ts
│   │   ├── DatabaseCommand.ts
│   │   ├── DbSeedCommand.ts
│   │   ├── DocsGenerateCommand.ts
│   │   ├── KeyGenerateCommand.ts
│   │   ├── ListCommand.ts
│   │   ├── MakeCommandCommand.ts
│   │   ├── MakeControllerCommand.ts
│   │   ├── MakeEventCommand.ts
│   │   ├── MakeJobCommand.ts
│   │   ├── MakeListenerCommand.ts
│   │   ├── MakeMiddlewareCommand.ts
│   │   ├── MakeMigrationCommand.ts
│   │   ├── MakeModelCommand.ts
│   │   ├── MakeProviderCommand.ts
│   │   ├── MakeSeederCommand.ts
│   │   ├── MigrateCommand.ts
│   │   ├── MigrateRollbackCommand.ts
│   │   ├── NewCommand.ts
│   │   ├── QueueTableCommand.ts
│   │   ├── ScheduleRunCommand.ts
│   │   ├── ScheduleWorkCommand.ts
│   │   └── ServeCommand.ts
│   ├── ApplicationLoader.ts
│   ├── Bootstrap.ts
│   ├── index.ts
│   └── TemplateManager.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/arikajs/arikajs/tree/main/packages/cli/blob/main/CONTRIBUTING.md).

---

## 📝 License

The ArikaJS CLI is open-sourced software licensed under the [MIT license](LICENSE).

---

## 💬 Support

- 📖 [Documentation](https://github.com/arikajs/arikajs/tree/main/packages/cli#readme)
- 💬 [Discord Community](https://discord.gg/arikajs)
- 🐛 [Issue Tracker](https://github.com/arikajs/arikajs/tree/main/packages/cli/issues)

---

<div align="center">

**Part of the ArikaJS Framework**

[GitHub](https://github.com/arikajs) • [npm](https://www.npmjs.com/package/arikajs)

</div>
