# @arikajs/scheduler

## 0.10.9

### Patch Changes

- 394c886: - chore: switch license from MIT to BSL-1.1 for all packages
  - fix(ci): add ESLint v8 and root .eslintrc.json to resolve CI lint failures
  - fix(foundation): correct prefer-const and ban-types lint errors
  - fix(router): correct prefer-const lint error in RouteEntry
  - docs: add trademark notice and BSL-1.1 license information to README
- Updated dependencies [394c886]
  - @arikajs/logging@0.10.9
  - @arikajs/foundation@0.10.9
  - @arikajs/cache@0.10.9
  - @arikajs/console@0.10.9
  - @arikajs/events@0.10.9
  - @arikajs/queue@0.10.9

## 0.10.8

### Patch Changes

- Updated dependencies [6dd5cde]
  - @arikajs/logging@0.10.8
  - @arikajs/foundation@0.10.8
  - @arikajs/cache@0.10.8
  - @arikajs/console@0.10.8
  - @arikajs/events@0.10.8
  - @arikajs/queue@0.10.8

## 0.10.7

### Patch Changes

- - Restored package hoisting (.npmrc).
  - Fixed workspace dependency declarations for internal packages.
  - Added explicit type dependencies (tsx, @types/node).
  - Formatted timestamp to YYYY-MM-DD HH:MM:SS format natively.
- Updated dependencies
  - @arikajs/cache@0.10.7
  - @arikajs/console@0.10.7
  - @arikajs/events@0.10.7
  - @arikajs/foundation@0.10.7
  - @arikajs/logging@0.10.7
  - @arikajs/queue@0.10.7

## 0.10.6

### Patch Changes

- @arikajs/cache@0.10.6
- @arikajs/console@0.10.6
- @arikajs/events@0.10.6
- @arikajs/foundation@0.10.6
- @arikajs/logging@0.10.6
- @arikajs/queue@0.10.6

## 0.10.5

### Patch Changes

- Added 'help' command to CLI, fixed missing auth config in app template, and resolved workspace dependency publishing issue.
- Updated dependencies
  - @arikajs/cache@0.10.5
  - @arikajs/console@0.10.5
  - @arikajs/events@0.10.5
  - @arikajs/foundation@0.10.5
  - @arikajs/logging@0.10.5
  - @arikajs/queue@0.10.5

## 0.10.4

### Patch Changes

- fix: strip workspace:\* protocol using pure pnpm publish
- Updated dependencies
  - @arikajs/cache@0.10.4
  - @arikajs/console@0.10.4
  - @arikajs/events@0.10.4
  - @arikajs/foundation@0.10.4
  - @arikajs/logging@0.10.4
  - @arikajs/queue@0.10.4

## 0.10.3

### Patch Changes

- @arikajs/cache@0.10.3
- @arikajs/console@0.10.3
- @arikajs/events@0.10.3
- @arikajs/foundation@0.10.3
- @arikajs/logging@0.10.3
- @arikajs/queue@0.10.3

## 0.0.8

### Patch Changes

- @arikajs/cache@0.0.8
- @arikajs/console@0.0.8
- @arikajs/events@0.0.8
- @arikajs/foundation@0.0.8
- @arikajs/logging@0.0.8
- @arikajs/queue@0.0.8

## 0.0.7

### Patch Changes

- @arikajs/cache@0.0.7
- @arikajs/console@0.0.7
- @arikajs/events@0.0.7
- @arikajs/foundation@0.0.7
- @arikajs/logging@0.0.7
- @arikajs/queue@0.0.7

## 0.0.6

### Patch Changes

- @arikajs/cache@0.0.6
- @arikajs/console@0.0.6
- @arikajs/events@0.0.6
- @arikajs/foundation@0.0.6
- @arikajs/logging@0.0.6
- @arikajs/queue@0.0.6

## 0.0.5

### Patch Changes

- feat: implement CSRF protection and standardized middleware architecture

  - Added session-based CSRF protection middleware.
  - Refactored middleware into project-level stubs for better customization.
  - Standardized auth controller stubs.
  - Enhanced CLI project scaffolding.
  - Added session and localization packages.

- Updated dependencies
  - @arikajs/cache@0.0.5
  - @arikajs/console@0.0.5
  - @arikajs/events@0.0.5
  - @arikajs/foundation@0.0.5
  - @arikajs/logging@0.0.5
  - @arikajs/queue@0.0.5
