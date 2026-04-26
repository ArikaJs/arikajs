# @arikajs/database

## 0.10.15

### Patch Changes

- fix: synchronize all workspace protocols

## 0.10.14

## 0.10.13

### Patch Changes

- feat: implement unique validation rule with database support
  chore: update documentation links to arikajs.github.io
  chore: fix tests and standardize test runner to use tsx

## 0.10.12

### Patch Changes

- 56e6015: docs: final polish of README footers and community links for public release.

## 0.10.11

### Patch Changes

- 360cda5: chore: transition to MIT license, update community links, and improve package metadata for public release.

## 0.10.10

### Patch Changes

- a1f7aac: - chore: complete transition of all individual package LICENSE files to MIT
  - docs: update all package READMEs to reflect the new MIT licensing and trademark notice
  - chore: remove all remaining references to MIT license from the active source and documentation

## 0.10.9

### Patch Changes

- 394c886: - chore: switch license from MIT to MIT for all packages
  - fix(ci): add ESLint v8 and root .eslintrc.json to resolve CI lint failures
  - fix(foundation): correct prefer-const and ban-types lint errors
  - fix(router): correct prefer-const lint error in RouteEntry
  - docs: add trademark notice and MIT license information to README

## 0.10.8

## 0.10.7

### Patch Changes

- - Restored package hoisting (.npmrc).
  - Fixed workspace dependency declarations for internal packages.
  - Added explicit type dependencies (tsx, @types/node).
  - Formatted timestamp to YYYY-MM-DD HH:MM:SS format natively.

## 0.10.6

## 0.10.5

### Patch Changes

- Added 'help' command to CLI, fixed missing auth config in app template, and resolved workspace dependency publishing issue.

## 0.10.4

### Patch Changes

- fix: strip workspace:\* protocol using pure pnpm publish

## 0.10.3

## 0.0.8

## 0.0.7

## 0.0.6

## 0.0.5

### Patch Changes

- feat: implement CSRF protection and standardized middleware architecture

  - Added session-based CSRF protection middleware.
  - Refactored middleware into project-level stubs for better customization.
  - Standardized auth controller stubs.
  - Enhanced CLI project scaffolding.
  - Added session and localization packages.
