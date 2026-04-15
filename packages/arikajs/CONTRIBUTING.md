# Contributing to ArikaJS

First off, thank you for considering contributing to ArikaJS! It's people like you who make ArikaJS such a great tool.

## 🌈 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Use the [GitHub Issue Tracker](https://github.com/ArikaJs/arikajs/issues).
- Check if the bug has already been reported.
- Use a clear and descriptive title.
- Provide a minimal reproduction repo or code snippet if possible.

### Suggesting Enhancements
- Open an issue with the tag `enhancement`.
- Describe the problem you're solving and why the new feature would be useful.

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies**: `npm install`
3. **Make your changes**.
4. **Run tests**: `npm test`
5. **Create a changeset**: Run `npm run change` to describe your change for the changelog.
6. **Commit and push**.
7. **Open a Pull Request**.

---

## 🏗️ Development Setup

ArikaJS is a monorepo managed with **Npm Workspaces** and **Turborepo**.

```bash
# Clone the repository
git clone https://github.com/arikajs/arikajs.git
cd arikajs

# Install all dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm test
```

### Building a Specific Package
```bash
npm run build --workspace=@arikajs/auth
```

### Running Tests for a Specific Package
```bash
npm test --workspace=@arikajs/auth
```

## 📝 Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning. If your PR includes a change that should be in the changelog (features, bug fixes), please run:

```bash
npm run change
```

Follow the prompts to select the packages you've modified and provide a brief description.

## 🎨 Coding Standards

- Use **TypeScript** for all core logic.
- Follow the existing code style (standardized via ESLint).
- Write descriptive commit messages.
- Ensure all new features include unit or integration tests.

## ⚖️ License

By contributing to ArikaJS, you agree that your contributions will be licensed under the **MIT License**.
