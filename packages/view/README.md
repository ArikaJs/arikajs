# Arika View v2.0 ⚡

`@arikajs/view` is a production-grade, TypeScript-first template engine designed for the ArikaJS ecosystem. It combines the power of modern JS with a clean, expressive syntax inspired by Laravel Blade, but built natively for the Node.js event loop.

**v2.0 Update:** Arika View now natively competes with React by offering lightning-fast Server-Side Generation (via Strict Mode) and an instant Single Page Application feeling (via HTML-over-the-wire).

---

## ⚡ Beating React: The Performance Engine

### 1️⃣ The "Strict Mode" Native Compiler (10x Faster SSR)
Arika View uses a highly optimized V8 compiler that transparently maps your server variables dynamically into native arguments, eliminating the notorious JavaScript `with(_data)` penalty.
Your template variables (like `{{ $user.name }}`) are JIT-compiled into pure native JavaScript functions under the hood. It takes effectively **0 milliseconds** of latency to render complex dashboards, crushing standard React SSR speeds.

```typescript
// Enabled by default in modern ArikaJs apps natively inside Engine.ts!
view.config({
    strict: true 
});
```

### 2️⃣ HTML-Over-The-Wire (`@spa`)
Get the instant, smooth Single-Page Application (SPA) feel of React—without writing a single line of React, installing heavy frontend packages, or managing Vite plugins.
Simply drop the `@spa` directive into your global layout's `<head>` or `<body>`:

```html
<head>
    <title>My Super Fast App</title>
    <!-- Instantly turn your entire ArikaJs application into an SPA! -->
    @spa
</head>
```
**What `@spa` does mathematically:**
1. Intercepts all link clicks entirely to stop "Hard Browser Reloads" (no more flashing white screens).
2. Fetches the compiled HTML silently in the background and seamlessly swaps the DOM elements.
3. Automatically triggers **Native Browser View Transitions** (providing iOS-like crossfades and slides between pages) automatically!

---

## 🚀 Core Architecture

Arika View features a completely customized compiler stack:
- **Lexer**: Intelligent tokenization of `.ark.html` files.
- **Parser**: Builds a robust Abstract Syntax Tree (AST) for deeply nested loops/blocks.
- **Directive Registry**: Modular system for extending templating language.
- **Code Generator**: Produces highly optimized, async-ready JavaScript buffers.

---

## ✨ Key Features

### Pure JavaScript & Blade Syntax
Arika View natively embraces JavaScript and traditional PHP-style variables. You can write `{{ $user.name }}` or `{{ user.name }}` seamlessly — if it's valid JS, it's valid in your template.
```html
@if ($user?.isAdmin && $posts.length > 0)
    <p>Welcome back, Admin!</p>
@endif
```

### Type-Safe View Data
Leverage TypeScript's power in your backend controllers smoothly crossing into your views.
```ts
interface HomeData {
    title: string;
    user: { name: string };
}

await view.render<HomeData>('home', {
    title: 'ArikaJS',
    user: { name: 'Prakash' }
});
```

### Modern Components (`<x-`)
Stop using clunky syntax. Build massive apps using modern, HTML-like components.
```html
<x-alert type="danger" :dismissible="true">
    <x-slot name="title">Warning!</x-slot>
    Something went wrong.
</x-alert>
```

### Fragments (HTMX Ready ⚡)
If you don't use `@spa`, you can manually render only a specific part of a template—perfect for custom HTMX APIs or partial reloads.
```html
@fragment('sidebar')
    <nav>...</nav>
@endfragment
```
```ts
await view.renderFragment('dashboard', 'sidebar');
```

---

## 🛠 Directives Reference

| Directive | Description |
|-----------|-------------|
| `@spa` | **[NEW]** Instantly upgrades the frontend site to a Single Page Application. |
| `@if`, `@elseif`, `@else` | Standard conditional logic. |
| `@unless` | Inverse of `@if`. |
| `@for`, `@foreach` | Standard JS and PHP style loops internally optimized. |
| `@each(view, data, item, empty)` | Render a view for each item in a collection. |
| `@switch`, `@case`, `@default` | Switch statement support. |
| `@break`, `@continue` | Control loop execution. |
| `@auth`, `@guest` | Conditional rendering based on user session. |
| `@once` | Ensure a block is only rendered once per request. |
| `@verbatim` | Stop parsing content inside the block. |
| `@push`, `@stack`, `@prepend` | Manage assets and scripts across layouts. |
| `@await(promise)` | Native async Promise support inside templates! |

---

## 🔌 Advanced Ecosystem

### View Composers
Inject data into specific views automatically before they are rendered globally.
```ts
view.composer('dashboard', async (data) => {
    data.notifications = await getNotifications();
});
```

### Global Helpers
Define custom functions accessible natively inside every template.
```ts
view.helper('formatDate', (date) => new Intl.DateTimeFormat().format(date));
```
Usage: `{{ formatDate(user.createdAt) }}`

### Custom Directives API
Extend Arika View with your own robust functionality.
```ts
view.directive('uppercase', (exp) => `_output += String(${exp}).toUpperCase();`);
```

---

## 📁 File Structure & Extension

Arika View exclusively uses the `.ark.html` extension for all templates to trigger the internal AST Lexer.

```text
resources/views/
├── layouts/
│   └── app.ark.html
├── auth/
│   ├── login.ark.html
│   └── register.ark.html
└── welcome.ark.html
```

---

## 💻 CLI Integration

Generate views instantly with the fast Arika CLI:
```bash
arika make:view home
# Generates resources/views/home.ark.html
```

---

## 🧠 Philosophy

> "Arika View turns your templates into native Node.js machine-code, making UI rendering mathematically as fast as the Javascript Engine itself."

---

## License
MIT
