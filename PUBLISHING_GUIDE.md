# Publishing ArikaJS to npm — Complete Guide

This guide walks you through the modern, automated publishing workflow for the ArikaJS monorepo using **pnpm** and **Changesets**.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [The Changesets Workflow](#the-changesets-workflow)
4. [Publishing Flow](#publishing-flow)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Document your changes
pnpm change

# 2. Bump versions and generate changelogs
pnpm version-packages

# 3. Publish to npm
pnpm release
```

---

## Prerequisites

### 1. npm Account & Login
You must be logged into npm locally:
```bash
npm login
npm whoami    # Verify your username
```

### 2. Organization Access
You must have access to the `@arikajs` npm organization to publish scoped packages.

### 3. pnpm Setup
The framework uses `pnpm` as its primary package manager. Ensure you are using `pnpm install` and executing commands at the workspace root.

---

## The Changesets Workflow

ArikaJS uses [`@changesets/cli`](https://github.com/changesets/changesets) to automatically manage versioning, dependencies, and changelogs across the monorepo.

### Step 1: Documenting Changes (`pnpm change`)
Whenever you add a feature, fix a bug, or make a breaking change, run:
```bash
pnpm change
```
You will be prompted to:
1. Select which packages your change affects.
2. Choose a semantic version bump (`major`, `minor`, `patch`).
3. Write a short summary of the change (this goes into `CHANGELOG.md`).

This creates a markdown file in the `.changeset/` folder. **Commit this file with your PR.**

### Step 2: Bumping Versions (`pnpm version-packages`)
When preparing for a release, run:
```bash
pnpm version-packages
```
This command consumes the markdown files in `.changeset/`, updates the `version` field in the relevant `package.json` files, and generates `CHANGELOG.md` files. 

*(If a package is incremented, and another package depends on it via `workspace:*`, Changesets intelligently updates the relationships.)*

After doing this, **commit the version bumps and changelog updates**.

---

## Publishing Flow

Once versions are bumped, you're ready to publish. 

### Step 3: Run the Release Script
```bash
pnpm release
```

Behind the scenes, this command does two things:
1. **`pnpm build` (Powered by Turbo):** Validates and compiles every package efficiently so `dist/` is fresh.
2. **`changeset publish`:** Automatically publishes the packages to npm.

**Key Benefits of this Flow:**
- 🚫 **No more manual package.json edits.**
- 🚫 **No more dealing with fragile `file:` fallback scripts.**
- ✅ Packages are correctly linked locally using `workspace:*`. During publish, `pnpm` automatically resolves these to the strict published versions.

### Next Steps (Optional)
If you wish to tag everything on GitHub, you can use existing internal Git workflows or standard GitHub release practices based on the generated changelogs. CI/CD integration using GitHub Actions `.github/workflows/ci.yml` is also configured for pull request safety.

---

## Troubleshooting

### "You do not have permission to publish"
```bash
npm login
```
Ensure you have access to the `@arikajs` org.

### Some dependencies have "workspace:*" on npm?
This shouldn't happen with `pnpm release` (which uses `changeset publish`). `pnpm` natively intercepts workspace protocols upon pack & publish, dynamically swapping them out for the real version listed in `package.json`. If you run raw `npm publish`, you might bypass this. Always publish using `pnpm release`.

### Build fails during `pnpm release`
The publish process will intentionally halt if `turbo build` fails. Investigate the terminal output, fix the TypeScript or missing dependency issue, and run `pnpm release` again. 

---

**Happy publishing! 🚀**

---

## 🌿 Version Branch Workflow (Recommended)

After publishing to npm, it is best practice to create a **version branch** in the repository that permanently marks the exact state of the code for that release. This makes it easy to hot-fix old versions without touching `main`.

### The Complete Publish → Branch Flow

```
Validate → npm publish → Create version branch → Push branch
```

### Step-by-Step

#### 1. Validate the Package Before Publishing

Run a dry-run to confirm the package looks correct before it goes live on npm:

```bash
# Check what files will be included in the published package
npm pack --dry-run

# Verify the binary works
node dist/bin/arika-deploy.js help

# Run doctor to check the tool itself
node dist/bin/arika-deploy.js doctor
```

#### 2. Publish to npm

```bash
# For monorepo packages (using pnpm changesets)
pnpm release

# For standalone package (e.g. arika-deploy)
cd packages/arika-deploy
npm publish --access public
```

#### 3. Create a Version Branch

Once published, immediately create a branch named after the version:

```bash
# Format: release/v<version>
# Example for version 0.1.0:
git checkout -b release/v0.1.0

git push origin release/v0.1.0
```

> **Branch Naming Convention:**
> | Release Type | Branch Name |
> |---|---|
> | Major release | `release/v1.0.0` |
> | Minor release | `release/v0.2.0` |
> | Patch / hotfix | `release/v0.1.1` |

#### 4. Go Back to `main` for Next Development

```bash
git checkout main
```

### Why This Matters

| Benefit | Description |
|---------|-------------|
| 🔖 **Permanent snapshot** | The branch captures the exact code that was published |
| 🔥 **Hotfix support** | If a bug is found in v0.1.0, checkout `release/v0.1.0`, fix, publish `v0.1.1` |
| 🧹 **Clean `main`** | `main` always has the latest development code |
| 🏷️ **GitHub Releases** | Each version branch maps to a GitHub Release tag |

### Full Example (arika-deploy v0.1.0)

```bash
# 1. Validate
cd packages/arika-deploy
node dist/bin/arika-deploy.js help
npm pack --dry-run

# 2. Publish
npm publish --access public

# 3. Create version branch
cd ../..  # back to monorepo root
git checkout -b release/v0.1.0
git push origin release/v0.1.0

# 4. Back to main
git checkout main
```
