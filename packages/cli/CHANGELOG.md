# @arikajs/cli

## 0.10.6

### Patch Changes

- @arikajs/benchmark@0.10.6
- @arikajs/console@0.10.6
- @arikajs/database@0.10.6
- @arikajs/docs@0.10.6
- @arikajs/scheduler@0.10.6

## 0.10.5

### Patch Changes

- Added 'help' command to CLI, fixed missing auth config in app template, and resolved workspace dependency publishing issue.
- Updated dependencies
  - @arikajs/console@0.10.5
  - @arikajs/database@0.10.5
  - @arikajs/docs@0.10.5
  - @arikajs/scheduler@0.10.5
  - @arikajs/benchmark@0.10.5

## 0.10.4

### Patch Changes

- fix: strip workspace:\* protocol using pure pnpm publish
- Updated dependencies
  - @arikajs/benchmark@0.10.4
  - @arikajs/console@0.10.4
  - @arikajs/database@0.10.4
  - @arikajs/docs@0.10.4
  - @arikajs/scheduler@0.10.4

## 0.10.3

### Patch Changes

- @arikajs/benchmark@0.10.3
- @arikajs/console@0.10.3
- @arikajs/database@0.10.3
- @arikajs/docs@0.10.3
- @arikajs/scheduler@0.10.3

## 0.0.8

### Patch Changes

- fix: ensure newly created projects automatically sync their framework version with the CLI version
  - @arikajs/console@0.0.8
  - @arikajs/database@0.0.8
  - @arikajs/docs@0.0.8
  - @arikajs/scheduler@0.0.8

## 0.0.7

### Patch Changes

- fix: removed workspace: versioning from http package and ensured CLI templates use semantic versions by default
  - @arikajs/console@0.0.7
  - @arikajs/database@0.0.7
  - @arikajs/docs@0.0.7
  - @arikajs/scheduler@0.0.7

## 0.0.6

### Patch Changes

- fix: ensure CLI templates use semantic version dependencies instead of local file paths when published to npm
  - @arikajs/console@0.0.6
  - @arikajs/database@0.0.6
  - @arikajs/docs@0.0.6
  - @arikajs/scheduler@0.0.6

## 0.0.5

### Patch Changes

- feat: implement CSRF protection and standardized middleware architecture

  - Added session-based CSRF protection middleware.
  - Refactored middleware into project-level stubs for better customization.
  - Standardized auth controller stubs.
  - Enhanced CLI project scaffolding.
  - Added session and localization packages.

- Updated dependencies
  - @arikajs/console@0.0.5
  - @arikajs/database@0.0.5
  - @arikajs/docs@0.0.5
  - @arikajs/scheduler@0.0.5
