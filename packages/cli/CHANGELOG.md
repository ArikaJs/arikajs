# @arikajs/cli

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
