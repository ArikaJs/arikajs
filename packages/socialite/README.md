# @arikajs/socialite

<div align="center">

**Modern, Fluent, and Scalable Social Authentication for ArikaJS**

[![npm version](https://img.shields.io/npm/v/@arikajs/socialite.svg?style=flat-square)](https://www.npmjs.com/package/@arikajs/socialite)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## 🚀 Purpose

`@arikajs/socialite` provides a fluent, expressive interface to OAuth authentication with various social providers. It abstracts the complex OAuth 2.0 flow into a simple, unified API, allowing you to integrate social logins (like Google, GitHub, or Facebook) into your ArikaJS application in minutes.

Instead of writing custom logic for every provider, `@arikajs/socialite` offers a consistent way to redirect users and retrieve their profiles, handling token exchanges and state validation automatically.

## 🏗️ Why we are developing this?

Modern web applications are expected to offer seamless login experiences. Manually implementing OAuth for multiple providers is:
1.  **Repetitive**: The flow is similar but the endpoints and data structures differ.
2.  **Error-Prone**: Handling state (CSRF protection) and token refreshes manually often leads to security vulnerabilities.
3.  **High Maintenance**: API changes from providers (like Facebook or Google) require updating your implementation constantly.

`@arikajs/socialite` solves this by providing a high-level driver-based system that keeps your code clean and your authentication secure.

---

## ✨ Feature Highlights

- 🎯 **Fluent API** - One line of code to redirect, one line to get the user.
- 🔐 **Built-in CSRF Protection** - Automatic state validation for all OAuth redirects.
- 📦 **Multi-Driver Architecture** - Easily switch between Google, GitHub, Facebook, etc.
- 📡 **Stateless Mode** - Support for API-only applications and SPAs.
- 🛠️ **Unified User Data** - Normalizes user profiles across all platforms.
- 🧪 **Test Friendly** - Easily mock social logins during development and testing.

---

## 🚀 Installation

You can install the package via npm:

```bash
npm install @arikajs/socialite
```

Once installed, you can quickly scaffold the configuration and environment variables using the Arika CLI:

```bash
node arika socialite:install
```

### Manual Configuration

If you prefer to configure it manually, publish the configuration file to `config/socialite.ts`:

```typescript
export default {
    /**
     * The default socialite driver to use.
     */
    default: 'github',

    /**
     * Socialite Providers Configuration
     */
    providers: {
        github: {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect: `${process.env.APP_URL}/auth/github/callback`,
        },

        google: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect: `${process.env.APP_URL}/auth/google/callback`,
            // Optional: specify additional scopes
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        },
    },
};
```

Add your credentials to your `.env` file:
```env
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret

GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

---

## 📚 Basic Usage

### 1. Redirecting to the Provider
In your controller, simply return the redirect for your chosen provider:

```typescript
import { Socialite } from '@arikajs/socialite';

export class LoginController {
    /**
     * Redirect the user to the GitHub authentication page.
     */
    async redirectToProvider(request, response) {
        return Socialite.driver('github').redirect();
    }
}
```

### 2. Handling the Callback
After the user authenticates, they are redirected back to your app. Retrieve their profile like this:

```typescript
export class LoginController {
    /**
     * Obtain the user information from GitHub.
     */
    async handleProviderCallback(request, response) {
        const socialiteUser = await Socialite.driver('github').user();

        // socialiteUser contains: 
        // id, nickname, name, email, avatar, etc.
        
        // Find or create a user in your local database
        const user = await User.updateOrCreate(
            { email: socialiteUser.email },
            { 
                name: socialiteUser.name,
                github_id: socialiteUser.id,
                avatar: socialiteUser.avatar 
            }
        );

        // Log them in!
        Auth.login(user);

        return response.redirect('/dashboard');
    }
}
```

### Stateless Usage (for APIs)
If you are building an API or a single-page application and don't use sessions:

```typescript
const user = await Socialite.driver('google').stateless().user();
```

---

## 🛠️ Supported Drivers

The following drivers are part of the core package:
- ✅ **Google**
- ✅ **GitHub**
- ✅ **Facebook**
- ✅ **X (formerly Twitter)**
- ✅ **LinkedIn**
- ✅ **GitLab**
- ✅ **Slack**

---

## 🤝 Community Adapters

Need more? You will be able to easily create your own drivers by extending the `AbstractProvider` class to support any OAuth 2.0 service.

---

## 📝 License

ArikaJS Socialite is open-sourced software licensed under the [MIT license](LICENSE).
