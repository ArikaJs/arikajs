## Arika Mail

`@arikajs/mail` is the email delivery system for the ArikaJS framework.

It provides a driver-based, configurable mailer with support for templated emails, attachments, and queue-ready delivery — with a beautiful, expressive API but built natively for Node.js and TypeScript.

This package allows applications to send emails without coupling to a specific transport.

---

## ✨ Features

- **Multiple mailers**: Configure different mail transports (SMTP)
- **Driver-based transport system**: Pluggable email backends
- **Class-based Mailables**: Reusable email classes
- **Templated emails**: Using `@arikajs/view` for rendering
- **Attachments**: Via `@arikajs/storage` integration
- **Multiple Recipients**: Full support for `to`, `cc`, and `bcc`
- **Queue-ready**: Native async delivery via `@arikajs/queue`
- **Plain text & HTML emails**: Support for both formats
- **TypeScript-first**: Full type safety with JavaScript support

---

## 📦 Installation

```bash
npm install @arikajs/mail
# or
yarn add @arikajs/mail
# or
pnpm add @arikajs/mail
```

---

## 🚀 Quick Start

### Sending a Basic Email

```ts
import { Mail } from '@arikajs/mail';

await Mail.to('user@example.com')
  .subject('Welcome')
  .text('Welcome to ArikaJS!')
  .send();
```

---

## 📬 Using Email Templates

```ts
await Mail.to('user@example.com')
  .subject('Welcome')
  .view('emails.welcome', { user })
  .send();
```

Templates are rendered using `@arikajs/view`.

---

## ✉️ Mailables (Recommended)

Mailables provide a clean, reusable way to define emails.

```ts
import { Mailable } from '@arikajs/mail';

export class WelcomeMail extends Mailable {
  constructor(private user: any) {
    super();
  }

  build() {
    return this
      .subject('Welcome to ArikaJS')
      .view('emails.welcome', { user: this.user });
  }
}
```

**Sending a mailable:**

```ts
await Mail.to(user.email).send(new WelcomeMail(user));
```

**Queuing a mailable:**

```ts
await Mail.to(user.email).queue(new WelcomeMail(user));
```

---

### Attachments

Attach files using Arika Storage:

```ts
await Mail.to('user@example.com')
  .subject('Invoice')
  .attach('invoices/2024.pdf')
  .send();
```

**From raw data (Buffer):**

```ts
const buffer = await generatePdf(data);

await Mail.to('user@example.com')
  .attachData(buffer, 'invoice.pdf')
  .send();
```

**From streams:**

```ts
const stream = getDynamicReportStream();

await Mail.to('user@example.com')
  .attachStream(stream, 'report.csv')
  .send();
```

### Multiple Recipients

```ts
await Mail.to('user@example.com')
  .cc(['manager@example.com', 'admin@example.com'])
  .bcc('audit@example.com')
  .subject('Notification')
  .send();
```

### Queued Delivery

Arika Mail integrates with `@arikajs/queue` for background processing.

```ts
import { Queue } from '@arikajs/queue';

// Configure queue on the mail system
Mail.setQueue(queueManager);

// Dispatch to background
await Mail.to('user@example.com').queue(new WelcomeMail(user));
```

---

## ⚙️ Configuration

Mail configuration is defined via the application config:

```ts
export default {
  default: process.env.MAIL_MAILER || 'log',

  mailers: {
    smtp: {
      transport: 'smtp',
      host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.MAIL_PORT || 587),
      username: process.env.MAIL_USERNAME,
      password: process.env.MAIL_PASSWORD,
      encryption: process.env.MAIL_ENCRYPTION || 'tls',
    },

    log: {
      transport: 'log',
    },

    array: {
      transport: 'array',
    },
  },

  from: {
    address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
    name: process.env.MAIL_FROM_NAME || 'Example',
  },
};
```

---

## 🚚 Supported Transports (v1)

| Transport | Status | Description |
| :--- | :--- | :--- |
| **SMTP** | ✅ Supported | Standard SMTP delivery |
| **Log** | ✅ Supported | Logs emails to console (for local dev) |
| **Array** | ✅ Supported | Stores emails in memory (for testing) |
| SES | ✅ Supported | Amazon SES driver |
| Mailgun | ✅ Supported | Mailgun API driver |
| SendGrid | ✅ Supported | SendGrid API driver |

---

## 📚 API Reference

### `Mail.to(address)`

Set the recipient email address.

```ts
Mail.to('user@example.com')
```

### `replyTo(address)`

Set the Reply-To address.

```ts
.replyTo('support@example.com')
```

### `subject(text)`

Set the email subject.

```ts
.subject('Welcome')
```

### `text(content)`

Set plain text email content.

```ts
.text('Plain text email')
```

### `view(name, data)`

Render an email template.

```ts
.view('emails.reset', { token })
```

### `attach(path)`

Attach a file from storage.

```ts
.attach('reports/file.pdf')
```

### `send(mailable?)`

Send the email.

```ts
await Mail.to('user@example.com').send();
```

or with a Mailable:

```ts
await Mail.to(user.email).send(new WelcomeMail(user));
```

---

## 🏗 Architecture

```text
mail/
├── src/
│   ├── Contracts
│   │   └── Transport.ts
│   ├── Jobs
│   │   └── SendQueuedMailable.ts
│   ├── Transport
│   │   ├── ArrayTransport.ts
│   │   ├── LogTransport.ts
│   │   ├── MailgunTransport.ts
│   │   ├── SendGridTransport.ts
│   │   ├── SesTransport.ts
│   │   └── SmtpTransport.ts
│   ├── index.ts
│   ├── Mailable.ts
│   ├── Mailer.ts
│   ├── MailManager.ts
│   └── Message.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Extending Mail (Custom Transports)

Create a custom transport:

```ts
import { Transport } from '@arikajs/mail';

class CustomTransport implements Transport {
  async send(message: any): Promise<void> {
    // Implementation
  }
}
```

Register it with `MailManager`.

---

## 🔗 Integration with ArikaJS

`@arikajs/mail` integrates with:

- **`@arikajs/view`** → Email templates
- **`@arikajs/storage`** → Attachments
- **`@arikajs/queue`** → Async email delivery
- **`@arikajs/config`** → Mailer configuration

---

## 🧪 Testing

Mailables and transports can be mocked for testing.
A log or array transport will be added for test environments.

---

## 🛣 Roadmap

- [ ] Queue-based sending
- [ ] Markdown email support
- [ ] Multiple recipients (CC/BCC)
- [ ] Mail previews
- [ ] Retry & failure handling

---

## 📄 License

`@arikajs/mail` is open-source software licensed under the **MIT License**.

---

## 🧭 Philosophy

> "Send emails, not headaches."
