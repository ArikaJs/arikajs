# Arika View v1.0 💎

`@arikajs/view` is a production-grade, TypeScript-first template engine designed for the ArikaJS ecosystem. It combines the power of modern JS with a clean, expressive syntax inspired by Laravel Blade, but built natively for the Node.js event loop.

---

## 🚀 Core Architecture

Arika View v1 features a completely rewritten compiler stack:
- **Lexer**: Intelligent tokenization of `.ark` files.
- **Parser**: Builds a robust Abstract Syntax Tree (AST) for complex nesting.
- **Directive Registry**: Modular system for extending template logic.
- **Code Generator**: Produces highly optimized, async-ready JavaScript.

---

## ✨ Key Features

### 1️⃣ Pure JavaScript Expressions
Arika View embraces JavaScript. No need to learn a limited expression language — if it's valid JS, it's valid in your template.
```html
@if (user?.isAdmin && posts.length > 0)
    <p>Welcome back, Admin!</p>
@endif
```

### 2️⃣ Type-Safe View Data
Leverage TypeScript's power in your views.
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

### 3️⃣ Modern Components (`<x-`)
Stop using clunky syntax. Use modern, HTML-like components.
```html
<x-alert type="danger" :dismissible="true">
    <x-slot name="title">Warning!</x-slot>
    Something went wrong.
</x-alert>
```

### 4️⃣ Smart Caching & Dev Mode
- **Hash-based Invalidation**: Templates only recompile when content actually changes.
- **Dev Mode**: Real-time recompilation and enhanced error stack traces with file/line references.
- **Production Mode**: Minified output and aggressive in-memory caching.

### 5️⃣ Fragments (HTMX Ready ⚡)
Render only a specific part of your template — perfect for HTMX or partial reloads.
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
| `@if`, `@elseif`, `@else` | Standard conditional logic. |
| `@unless` | Inverse of `@if`. |
| `@for` | Standard JS loop. |
| `@each(view, data, item, empty)` | Render a view for each item in a collection. |
| `@switch`, `@case`, `@default` | Switch statement support. |
| `@break`, `@continue` | Control loop execution. |
| `@auth`, `@guest` | Conditional rendering based on user session. |
| `@once` | Ensure a block is only rendered once per request. |
| `@verbatim` | Stop parsing content inside the block. |
| `@push`, `@stack`, `@prepend` | Manage assets and scripts across layouts. |
| `@await(promise)` | Native async support inside templates. |

---

## 🔌 Advanced Ecosystem

### View Composers
Inject data into specific views automatically before they are rendered.
```ts
view.composer('dashboard', async (data) => {
    data.notifications = await getNotifications();
});
```

### Global Helpers
Define custom functions accessible in every template.
```ts
view.helper('formatDate', (date) => new Intl.DateTimeFormat().format(date));
```
Usage: `{{ formatDate(user.createdAt) }}`

### Custom Directives API
Extend Arika View with your own powerful directives.
```ts
view.directive('uppercase', (exp) => `_output += String(${exp}).toUpperCase();`);
```

---

## 📁 File Structure & Extension

Arika View exclusively uses the `.ark.html` extension for all templates.

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

Generate views instantly with the Arika CLI:
```bash
arika make:view home
# Generates resources/views/home.ark.html
```

---

## 🧠 Philosophy

> "Arika View turns your templates into native Node.js code, making UI rendering as fast as the engine itself."

---

## License
MIT
