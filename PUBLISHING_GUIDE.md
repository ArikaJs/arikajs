# Publishing ArikaJS to npm — Complete Guide

This guide walks you through publishing all ArikaJS packages to the npm registry safely.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Publishing Workflow](#publishing-workflow)
4. [Version Management](#version-management)
5. [Script Reference](#script-reference)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Build all packages (with file: deps for local resolution)
# 2. Prepare for publish (converts file: → version deps, creates backups)
./scripts/prepare-for-publish.sh

# 3. Publish to npm (with safety checks, dry-run, and skip-existing)
./scripts/publish-all.sh

# 4. Restore local dev dependencies
./scripts/restore-dev-dependencies.sh

# 5. Git release (optional)
./scripts/github-release-all.sh
```

---

## Prerequisites

### 1. npm Account & Login

```bash
npm login
npm whoami    # verify you're logged in
```

### 2. Organization Access

For `@arikajs/*` scoped packages, you need access to the `@arikajs` npm organization.

### 3. All Packages Built

Each package must have a `dist/` directory. Build with `file:` deps before preparing for publish.

---

## Publishing Workflow

### Step 1: Build All Packages

Build each package in dependency order with `file:` dependencies active:

```bash
for dir in config foundation http logging events encryption cache storage validation console router dispatcher middleware database auth authorization mail queue scheduler view docs arikajs cli; do
  echo "Building $dir..."
  cd $dir && npm run build && cd ..
done
```

### Step 2: Prepare for Publish

```bash
./scripts/prepare-for-publish.sh
```

This script:
- ✅ Creates `package.json.backup` in every package directory
- ✅ Replaces `file:../xxx` with `^actual_version` (reads real version from each package)
- ✅ Verifies all packages have `dist/` built
- ✅ Checks for README.md and LICENSE files
- ✅ Shows a publication preview

### Step 3: Publish to npm

```bash
./scripts/publish-all.sh
```

This script has **built-in safety features**:

| Feature | Description |
|---------|-------------|
| 🔍 **Pre-flight checks** | Verifies npm login, package builds, and package.json validity |
| ⏭️ **Skip existing versions** | Automatically skips packages already published at that version |
| 🧪 **Dry-run first** | Runs `npm publish --dry-run` on ALL packages before any real publish |
| 🔁 **Resume support** | Can safely re-run after a partial failure — already published packages are skipped |
| 🛑 **Stops on failure** | If any publish fails, stops immediately (no further version waste) |

### Step 4: Restore Dev Dependencies

```bash
./scripts/restore-dev-dependencies.sh
```

Restores `file:` dependencies from backups for local development.

### Step 5: Git Release (Optional)

```bash
./scripts/github-release-all.sh
```

Creates Git tags and GitHub releases for all packages.

---

## Version Management

### Bumping Versions

Use the version bump script to update all packages at once:

```bash
# Bump patch version (0.1.4 → 0.1.5)
./scripts/bump-version.sh patch

# Bump minor version (0.1.4 → 0.2.0)
./scripts/bump-version.sh minor

# Bump major version (0.1.4 → 1.0.0)
./scripts/bump-version.sh major

# Set specific version
./scripts/bump-version.sh 0.2.0
```

### Semantic Versioning

ArikaJS follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Pre-release Versions

```bash
# Publish a beta release
npm version prerelease --preid=beta
npm publish --access public --tag beta

# Install beta
npm install @arikajs/package@beta
```

---

## Script Reference

| Script | Purpose |
|--------|---------|
| `scripts/bump-version.sh` | Bump version across all packages (patch/minor/major) |
| `scripts/prepare-for-publish.sh` | Convert `file:` deps → version deps, verify builds |
| `scripts/publish-all.sh` | Safely publish all packages to npm |
| `scripts/restore-dev-dependencies.sh` | Restore `file:` deps for local development |
| `scripts/github-release-all.sh` | Create Git tags and GitHub releases |

### Workflow Order

```
bump-version.sh → build → prepare-for-publish.sh → publish-all.sh → restore-dev-dependencies.sh
```

---

## Troubleshooting

### "Version already published"

**Not a problem!** The publish script automatically skips versions that are already on npm. Just re-run the script.

### Publish failed mid-way

**Just re-run `./scripts/publish-all.sh`**. Already-published packages are skipped automatically. No version numbers are wasted.

### "You do not have permission to publish"

```bash
npm login
npm whoami   # Verify you're logged in
```

Ensure you have access to the `@arikajs` organization.

### Build files not included

Check the `files` field in `package.json`:

```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```

### Dependencies still showing `file:` paths

Run the prepare script first:
```bash
./scripts/prepare-for-publish.sh
```

### Need to start over

```bash
# Restore all package.json files to local dev state
./scripts/restore-dev-dependencies.sh
```

---

## Publishing Checklist

### Before Publishing
- [ ] All packages built (`dist/` exists)
- [ ] Tests passing
- [ ] Version numbers bumped (if needed)
- [ ] README.md files updated
- [ ] Git committed

### Publishing
- [ ] Run `./scripts/prepare-for-publish.sh`
- [ ] Run `./scripts/publish-all.sh`
- [ ] Run `./scripts/restore-dev-dependencies.sh`

### After Publishing
- [ ] Verify on [npmjs.com](https://npmjs.com)
- [ ] Test: `npm install arikajs @arikajs/cli`
- [ ] Create GitHub release: `./scripts/github-release-all.sh`
- [ ] Git commit & push

---

## Quick Reference Commands

```bash
npm login                        # Login to npm
npm whoami                       # Check login status
npm pack --dry-run               # Preview what will be published
npm view @arikajs/foundation     # View published package info
npm unpublish @arikajs/pkg@ver   # Unpublish (within 72 hours only!)
```

---

**Happy publishing! 🚀**
