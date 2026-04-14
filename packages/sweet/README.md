# @arikajs/sweet 🍭

**Premium, Advanced Alerts & Notifications for ArikaJS.**

`@arikajs/sweet` is a high-performance, zero-dependency UI notification package designed for the ArikaJS ecosystem. It provides the fluid experience of SweetAlert combined with advanced, modern features like Glassmorphism, Chained Promises, and Stacked Toasts.

---

## ✨ Features

- **💎 Glassmorphism Design**: Modern, translucent UI components that feel premium out of the box.
- **🔄 Smart Promises**: Built-in support for `sweet.promise()` which handles loading, success, and error states in one go.
- **🥞 Stackable Toasts**: Support for multiple notifications that stack beautifully in corners.
- **🔗 Chained Alerts**: Easily sequence multiple alerts with an elegant fluent API.
- **⚡ Zero Dependencies**: Pure Vanilla JS/TS and CSS. Tiny footprint.
- **📱 Fully Responsive**: Works perfectly on mobile and desktop.
- **🎮 Fully Accessible**: Aria-compliant and keyboard-friendly.

---

## 🚀 Getting Started

### Installation

```bash
pnpm add @arikajs/sweet
```

### Basic Usage

```javascript
import { sweet } from '@arikajs/sweet';

// Simple Alert
sweet.fire('Hello Arika!', 'This is a premium alert.', 'success');

// Success Shortcut
sweet.success('Board created!');
```

---

## 🧙‍♂️ Advanced Features

### 1. The Promise Handler (Arika Exclusive)
Handle your async tasks with zero extra logic.

```javascript
sweet.promise(createBoard(data), {
    loading: 'Creating your board...',
    success: 'Board created successfully!',
    error: (err) => `Failed: ${err.message}`
});
```

### 2. Stacked Toasts
Fire multiple notifications without them overlapping.

```javascript
sweet.toast('You have a new message!', 'info');
sweet.toast('Project updated.', 'success');
```

### 3. Confirmation Dialogs
Using async/await for logical flow.

```javascript
if (await sweet.confirm('Are you sure?', 'This cannot be undone.')) {
    // perform action...
}
```

---

## 🛠️ Configuration

Customize every aspect of your alerts:

```javascript
sweet.fire({
    title: 'Custom Layout',
    text: 'ArikaJS gives you full control.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    backdrop: 'blur(10px)',
    timer: 3000
});
```

---

## 📄 License
BSL-1.1 © Prakash Tank(https://github.com/ArikaJs)
