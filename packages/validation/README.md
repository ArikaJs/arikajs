## Arika Validation

`@arikajs/validation` provides a powerful, expressive validation system for the ArikaJS framework.

It allows developers to validate incoming data using declarative rules, handle errors consistently, and integrate validation seamlessly into controllers and middleware.

```ts
import { Validator } from '@arikajs/validation';

const validator = new Validator(
  {
    email: 'test@example.com',
    password: 'secret123'
  },
  {
    email: 'required|email',
    password: 'required|min:8'
  }
);

if (validator.fails()) {
  console.log(validator.errors());
}
```

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Rule-based validation syntax
  - Custom rule support
  - Multiple error messages per field
  - Async validation support
  - JS & TS friendly API
- **Out of scope (for this package)**:
  - Parsing HTTP requests
  - Rendering views
  - Authentication logic

---

## 🎯 Purpose

Validation protects application logic from invalid or unsafe input. This package is responsible for:
- Validating request data (body, query, params)
- Providing rule-based validation
- Supporting custom validation rules
- Returning structured validation errors
- Integrating cleanly with HTTP and controllers

---

## 🧠 Responsibilities

### ✅ What Arika Validation Does
- Validate plain JavaScript objects
- Support string-based validation rules
- Provide reusable rule classes
- Collect and format validation errors
- Allow synchronous and asynchronous rules
- Integrate with controllers & middleware

### ❌ What Arika Validation Does NOT Do
- Parse HTTP requests
- Render views
- Handle authentication or authorization
- Perform database operations

---

## Features

- **Rule-based validation syntax**
  - Intuitive pipe-based rules like `required|email|min:8`.
- **Custom rule support**
  - Easily extend the validator with your own logic.
- **Multiple error messages per field**
  - Comprehensive feedback for users.
- **Async validation support**
  - Validate against databases or external services.
- **Framework-agnostic core**
  - Use it anywhere, not just in ArikaJS.
- **JS & TS friendly API**
  - Written in TypeScript with full type definitions.

---

## Installation

```bash
npm install @arikajs/validation
# or
yarn add @arikajs/validation
# or
pnpm add @arikajs/validation
```

---

## 🔎 Validation Rules

Rules are defined using a pipe-based syntax:

```ts
email: 'required|email'
password: 'required|min:8|max:32'
```

### 📦 Built-in Rules (v0.x)

| Rule | Description |
| :--- | :--- |
| `required` | Field must be present and not empty |
| `nullable` | Field can be null or empty |
| `bail` | Stop validation after first failure for a field |
| `email` | Must be a valid email address |
| `min:value` | Minimum length (string) or value (number) |
| `max:value` | Maximum length (string) or value (number) |
| `string` | Must be a string |
| `number` | Must be numeric |
| `required_if:field,value` | Required if another field matches a value |
| `in:foo,bar` | The field under validation must be included in the given list of values |
| `not_in:foo,bar` | The field under validation must not be included in the given list of values |
| `alpha` | The field under validation must be entirely alphabetic characters |
| `alpha_num` | The field under validation must be entirely alpha-numeric characters |
| `url` | Must be a valid URL |
| `boolean` | Must be a boolean (e.g., `true`, `false`, `1`, `0`) |
| `array` | Must be a JavaScript array |
| `confirmed` | The field must have a matching field of `_confirmation` (e.g. `password` needs `password_confirmation`) |

### 🚀 Advanced Features

- **Nested Object Validation**: Use dot notation to validate deep structures (`user.email`).
- **Array Wildcard Validation**: Use `*` to validate all elements in an array (`users.*.email`).
- **Bail Validation**: Stop executing rules for a field after the first failure.
- **Validated Data**: Use `validator.validated()` to get only the data that passed validation.
- **Conditional Rules**: Rules that only run based on the values of other fields.

---

## 🧱 Custom Rules

### Creating a Rule

```ts
import { Rule } from '@arikajs/validation';

export class Uppercase implements Rule {
  validate(value: any): boolean {
    return typeof value === 'string' && value === value.toUpperCase();
  }

  message(): string {
    return 'The value must be uppercase.';
  }
}
```

### Registering a Rule

```ts
validator.extend('uppercase', new Uppercase());
```

### Usage

```ts
name: 'required|uppercase'
```

---

## ❌ Validation Errors

### Checking Failure

```ts
if (validator.fails()) {
  throw new ValidationError(validator.errors());
}
```

### Error Structure

```json
{
  "email": ["The email field is required."],
  "password": ["The password must be at least 8 characters."]
}
```

### Customizing Error Messages

You can pass an object of custom messages as the third argument to the `Validator` constructor. You can override globally for a rule or target specific fields.

```ts
const validator = new Validator(data, rules, {
    'required': 'Hold up, you forgot the :attribute field!',
    'email.email': 'Dude, that is not a real email address!'
});
```

---

## 🔌 Framework Integration

### Controller Usage
*(Provided by `@arikajs/http`)*

```ts
request.validate({
  email: 'required|email',
  password: 'required|min:8'
});
```

### Middleware Usage

```ts
export async function validateLogin(request, next) {
  const validator = new Validator(request.body, {
    email: 'required|email',
    password: 'required'
  });

  if (validator.fails()) {
      return response.status(422).json(validator.errors());
  }

  return next(request);
}
```

---

## ⚙️ Advanced Usage

### Async Validation

```ts
class UniqueEmail {
  async validate(value) {
    return !(await userRepo.exists(value));
  }

  message() {
    return 'Email already taken.';
  }
}
```

---

## 🏗 Architecture

```text
validation/
├── src/
│   ├── Rules
│   │   ├── Alpha.ts
│   │   ├── AlphaNum.ts
│   │   ├── Boolean.ts
│   │   ├── Confirmed.ts
│   │   ├── Email.ts
│   │   ├── In.ts
│   │   ├── IsArray.ts
│   │   ├── Max.ts
│   │   ├── Min.ts
│   │   ├── NotIn.ts
│   │   ├── Number.ts
│   │   ├── Required.ts
│   │   ├── RequiredIf.ts
│   │   ├── String.ts
│   │   └── Url.ts
│   ├── ErrorBag.ts
│   ├── index.ts
│   ├── Rule.ts
│   ├── ValidationError.ts
│   └── Validator.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Versioning & Stability

- Current version: **v0.x** (experimental)
- API may change until **v1.0**
- Will follow semantic versioning after stabilization

---

## 📜 License

`@arikajs/validation` is open-sourced software licensed under the **MIT License**.

---

## 🧠 Philosophy

> “Validation is not restriction — it is protection.”

