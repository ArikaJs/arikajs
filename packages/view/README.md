# Arika View v2.0 ⚡

`@arikajs/view` is a high-performance, server-first template engine designed for the ArikaJS ecosystem. It provides an instant Single-Page Application (SPA) experience using a native Node.js compiler, eliminating the complexity of heavy client-side frameworks.

---

## ⚡ Server-Driven Native Performance

### 1️⃣ Zero-Runtime Overhead (Strict Mode)
Arika View uses a highly optimized V8 compiler that maps your server variables directly into native function arguments. By eliminating the `with(_data)` runtime lookup used by traditional engines like EJS, we achieve near-zero latency rendering.

Your template variables (like `{{ $user.name }}`) are JIT-compiled into pure native JavaScript functions, making UI rendering mathematically as fast as the V8 engine itself.

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

## 🛡️ Security & XSS Protection

Everything in Arika View is **Safe by Default**.

### Escaped Output (Standard)
All values inside double curly braces are automatically escaped to prevent Cross-Site Scripting (XSS) attacks.
```html
{{ "<script>alert(1)</script>" }}
<!-- Renders as: &lt;script&gt;alert(1)&lt;/script&gt; -->
```

### Raw Output (Unsafe)
If you specifically need to output raw HTML, use the `{!! !!}` syntax. **Use this only for content you trust.**
```html
{!! "<h1>Trusted Title</h1>" !!}
```

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
