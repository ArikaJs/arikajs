# ArikaJS Engineering Principles for AI Assistants

## Protocol 1: Prioritize Pre-built Packages and Methods
Always check for existing implementation in the core `@arikajs` packages before writing custom logic or duplicating code.

### 1. HTTP & Request Management
- **Request Helpers**: Use native `req.ip()`, `req.ajax()`, `req.wantsJson()`, and `req.expectsJson()` instead of manual header checks.
- **Lazy Contexts**: Use `req.auth` and `req.view` to access authentication and view engines. Do NOT manually create contexts or cast to `any` if it can be avoided.
- **Middleware Aliases**: Use predefined aliases like `auth`, `auth:web`, `auth:api`, `verified`, and `throttle` in route definitions.

### 2. Middleware & Kernel
- **BaseKernel**: Application kernels should extend `BaseKernel` from `arikajs`. Do NOT redeclare global middlewares (CORS, SecurityHeaders, TrimStrings) or groups (web, api) if they match the defaults.
- **Core Middleware**: Use middleware from `@arikajs/http` (e.g., `SecurityHeaders`, `Throttle`, `CorsMiddleware`) instead of local copies in the application template.

### 3. Authentication
- **Intelligent Response**: The core `Authenticate` middleware handles both JSON errors and Web redirects automatically. Use the framework-provided `Authenticate` class.

## Protocol 2: CLI & Scaffolding
- **Maintain Stubs**: Ensure CLI command stubs (e.g., `AuthWebInstallCommand`, `AuthApiInstallCommand`) are kept in sync with the latest framework patterns (using `req.auth`, etc.).
- **Minimal Boilerplate**: Scaffolds should generate the minimum code necessary, relying on the framework for standard logic.
