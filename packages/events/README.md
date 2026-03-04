
## Arika Events

`@arikajs/events` is the event dispatching and listener system for the ArikaJS framework.

It provides a clean, expressive way to decouple application logic using events and listeners — enabling scalable, maintainable, and testable architectures.

This package is part of the ArikaJS framework and provides a robust event system for Node.js and TypeScript applications.

---

## ✨ Features

- **Event dispatching**: Centralized event management
- **Multiple listeners per event**: Support for one-to-many event handling
- **Class-based events & listeners**: Structured, object-oriented approach
- **Automatic dependency injection**: Resolving listeners via the service container
- **Sync and async listeners**: Flexible execution models
- **Queue-ready architecture**: Designed for background processing
- **Simple, expressive API**: Easy to use and understand

---

## 📦 Installation

```bash
npm install @arikajs/events
# or
yarn add @arikajs/events
# or
pnpm add @arikajs/events
```

---

## 🚀 Quick Start

### Dispatching an Event

```ts
import { Event } from '@arikajs/events';

Event.dispatch(new UserRegistered(user));
```

### Listening to Events

```ts
import { Event } from '@arikajs/events';

Event.listen(UserRegistered, SendWelcomeEmail);
```

### 🧠 Class-Based Events

```ts
export class UserRegistered {
  constructor(public user: any) {}
}
```

### 🎧 Listeners

```ts
export class SendWelcomeEmail {
  async handle(event: UserRegistered) {
    // send email
  }
}
```

Listeners are automatically resolved via the service container.

---

## 🔁 Async & Queued Listeners

Listeners can be marked as asynchronous:

```ts
export class LogRegistration {
  shouldQueue = true;

  async handle(event: any) {
    // queued execution
  }
}
```

(Queue integration is enabled via `@arikajs/queue`.)

---

## ⚙️ Configuration

Event configuration fits naturally within your application structure:

```ts
export default {
  events: {
    UserRegistered: [
      SendWelcomeEmail,
      LogRegistration
    ]
  }
};
```

---

## 📚 API Reference

### 🔢 Listener Priorities

You can control the order in which listeners execute by passing a priority (higher numbers run first).

```ts
Event.listen(OrderPlaced, ProcessPayment, 100);
Event.listen(OrderPlaced, SendEmail, 0); // Runs after payment
```

### 🃏 Wildcard Events

Listen to a group of events using the `*` wildcard.

```ts
Event.listen('user.*', (event) => {
    // Handled for 'user.login', 'user.registered', etc.
});
```

### `Event.dispatch(event)`

Dispatch an event instance.

```ts
Event.dispatch(new OrderPlaced(order));
```

### `Event.listen(event, listener)`

Register a listener for a specific event class.

```ts
Event.listen(OrderPlaced, ProcessPayment);
```

### `Event.forget(event)`

Remove all listeners for an event.

```ts
Event.forget(OrderPlaced);
```

### 🔁 Event Subscribers

Subscribers are classes that can subscribe to multiple events from within a single class.

```ts
class UserEventSubscriber {
    subscribe(events) {
        events.listen('user.login', this.onUserLogin);
        events.listen('user.logout', this.onUserLogout);
    }
    
    onUserLogin(event) { /* ... */ }
    onUserLogout(event) { /* ... */ }
}

Event.subscribe(UserEventSubscriber);
```

---

## 🏗 Architecture

```text
events/
├── src/
│   ├── Contracts
│   │   └── Listener.ts
│   ├── Exceptions
│   │   └── EventException.ts
│   ├── Dispatcher.ts
│   ├── EventManager.ts
│   ├── index.ts
│   └── ListenerResolver.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔗 Integration with ArikaJS

`@arikajs/events` integrates with:

- **`@arikajs/mail`** → email triggers
- **`@arikajs/queue`** → async listeners
- **`@arikajs/logging`** → event logs
- **`@arikajs/auth`** → auth lifecycle hooks

---

## 🧪 Testing

The Arika event system provides powerful testing helpers to mock event dispatching.

```ts
it('dispatches the order event', async () => {
    Event.fake();

    await someBusinessLogic();

    Event.assertDispatched(OrderPlaced);
    // Use a callback for custom assertions
    Event.assertDispatched(OrderPlaced, (event) => {
        return event.id === 123;
    });
});
```

---

## 🛣 Roadmap

- [x] Event subscribers
- [x] Wildcard events
- [x] Listener priorities
- [ ] Event discovery
- [ ] Event caching

---

## 📄 License

`@arikajs/events` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Great systems don’t call each other — they react."
