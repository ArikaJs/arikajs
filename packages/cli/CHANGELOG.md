# @arikajs/cli

## 0.10.12

### Patch Changes

- 56e6015: docs: final polish of README footers and community links for public release.
- Updated dependencies [56e6015]
  - arikajs@0.10.12
  - @arikajs/benchmark@0.10.12
  - @arikajs/console@0.10.12
  - @arikajs/database@0.10.12
  - @arikajs/docs@0.10.12
  - @arikajs/scheduler@0.10.12

## 0.10.11

### Patch Changes

- 360cda5: chore: transition to MIT license, update community links, and improve package metadata for public release.
- Updated dependencies [360cda5]
  - arikajs@0.10.11
  - @arikajs/benchmark@0.10.11
  - @arikajs/console@0.10.11
  - @arikajs/database@0.10.11
  - @arikajs/docs@0.10.11
  - @arikajs/scheduler@0.10.11

## 0.10.10

### Patch Changes

- a1f7aac: - chore: complete transition of all individual package LICENSE files to MIT
  - docs: update all package READMEs to reflect the new MIT licensing and trademark notice
  - chore: remove all remaining references to MIT license from the active source and documentation
- Updated dependencies [a1f7aac]
  - arikajs@0.10.10
  - @arikajs/console@0.10.10
  - @arikajs/database@0.10.10
  - @arikajs/docs@0.10.10
  - @arikajs/scheduler@0.10.10
  - @arikajs/benchmark@0.10.10

## 0.10.9

### Patch Changes

- 394c886: - chore: switch license from MIT to MIT for all packages
  - fix(ci): add ESLint v8 and root .eslintrc.json to resolve CI lint failures
  - fix(foundation): correct prefer-const and ban-types lint errors
  - fix(router): correct prefer-const lint error in RouteEntry
  - docs: add trademark notice and MIT license information to README
- Updated dependencies [394c886]
  - arikajs@0.10.9
  - @arikajs/benchmark@0.10.9
  - @arikajs/console@0.10.9
  - @arikajs/database@0.10.9
  - @arikajs/scheduler@0.10.9
  - @arikajs/docs@0.10.9

## 0.10.8

### Patch Changes

- 6dd5cde: - fix(view): resolve HMR duplicate watchers by adding CLI bootstrap detection
  - fix(view): resolve component AST parsing issues in CodeGenerator
  - fix(logging): safely handle missing config contexts in LogManager
  - fix(cli): optimize process isolation between CLI and server
  - perf: standardized benchmark suite and optimized warp drive routing
- Updated dependencies [6dd5cde]
  - arikajs@0.10.8
  - @arikajs/benchmark@0.10.8
  - @arikajs/scheduler@0.10.8
  - @arikajs/docs@0.10.8
  - @arikajs/console@0.10.8
  - @arikajs/database@0.10.8

## 0.10.7

### Patch Changes

- - Restored package hoisting (.npmrc).
  - Fixed workspace dependency declarations for internal packages.
  - Added explicit type dependencies (tsx, @types/node).
  - Formatted timestamp to YYYY-MM-DD HH:MM:SS format natively.
- Updated dependencies
  - arikajs@0.10.7
  - @arikajs/benchmark@0.10.7
  - @arikajs/console@0.10.7
  - @arikajs/database@0.10.7
  - @arikajs/docs@0.10.7
  - @arikajs/scheduler@0.10.7

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
