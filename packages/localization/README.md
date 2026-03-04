# Arika Localization

`@arikajs/localization` provides a deep, flexible, and powerful localization system for the ArikaJS framework.

It allows your application to support multiple languages for API responses, validation messages, and views, while remaining lightweight and easy to use.

```ts
import { Translator } from '@arikajs/localization';

const translator = new Translator('en');
translator.load('en', 'auth', {
    'welcome': 'Welcome back, :name!'
});

console.log(translator.get('auth.welcome', { name: 'Arika' })); 
// Output: Welcome back, Arika!
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Dot-notation key lookups
  - Dynamic placeholder replacements
  - Fallback locale support
  - JSON-based translation loading
  - Pluralization support (Advanced)
  - JS & TS friendly API

---

## 🎯 Purpose

Localization is about more than just translating words; it's about providing a culturally relevant experience for your users.

This package is responsible for:
- Managing multiple language repositories.
- Resolving keys to localized strings.
- Handling dynamic content via placeholders.
- Implementing complex pluralization rules.
- Integrating with the ArikaJS core for seamless use in Controllers and Views.

---

## Features

- **Dot-Notation Support**: Access nested keys easily (e.g., `validation.required`, `auth.login.success`).
- **Dynamic Replacements**: Use `:placeholders` to inject variable data into your translations.
- **Fallback Locales**: Automatically fall back to a default language if a translation is missing in the current locale.
- **Pluralization**: Handle singular and plural forms with complex range support (e.g., `0 items`, `1 item`, `5 items`).
- **JSON First**: Optimized for JSON-based translation files, making it easy to manage languages across and outside your codebase.
- **Type Safe**: Fully written in TypeScript with complete type definitions.

---

## Installation

```bash
npm install @arikajs/localization
```

---

## 🧩 Usage

### Basic Translation

```ts
// Get a simple line
translator.get('messages.welcome');

// With replacements
translator.get('messages.hello', { name: 'John' }); // "Hello, John"
```

### Pluralization (Advanced)

Pluralization allows you to define different strings based on a count. Use the `|` character to separate singular and plural forms.

```ts
translator.load('en', 'messages', {
    'apples': '{0} There are no apples|{1} There is one apple|[2,*] There are :count apples'
});

// Using the choice method
translator.choice('messages.apples', 0); // "There are no apples"
translator.choice('messages.apples', 1); // "There is one apple"
translator.choice('messages.apples', 5); // "There are 5 apples"
```

### Fallback Logic

If a key doesn't exist in the current locale (e.g., `es`), the translator will automatically look for it in the fallback locale (e.g., `en`).

---

## 🏗 Architecture

```text
localization/
├── src/
│   ├── Contracts/
│   │   └── Translator.ts
│   ├── MessageSelector.ts   (Handles pluralization logic)
│   ├── Translator.ts        (Core logic)
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Advanced Roadmap

- [ ] **Date & Number Formatting**: Localized helpers for dates, currencies, and numbers.
- [ ] **Validation Integration**: Automatic localization for `@arikajs/validation` rules.
- [ ] **React/Vue/ArkView Helpers**: Directives and hooks for frontend integration.
- [ ] **External API Sync**: Tooling to sync translations with services like Phrase or Lokalise.

---

## 📜 License

`@arikajs/localization` is open-sourced software licensed under the **MIT License**.
