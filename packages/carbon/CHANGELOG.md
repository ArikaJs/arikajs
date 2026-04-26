# @arikajs/carbon Changelog

## 0.10.15

### Patch Changes

- fix: synchronize all workspace protocols

## 0.10.14

## 0.10.13

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

All notable changes to this project will be documented in this file.

## [0.10.2] - 2026-03-22

### Added

- Initial release of `@arikajs/carbon`
- `Carbon` class — immutable, chainable, timezone-aware date/time library
- `carbon()` convenience function helper
- Full static factory methods: `now()`, `today()`, `yesterday()`, `tomorrow()`, `parse()`, `create()`, `fromTimestamp()`, `fromMillis()`
- PHP-compatible `format()` with all standard date tokens
- Shorthand formatters: `toDateString()`, `toDateTimeString()`, `toHumanString()`, `toISOString()`, `toRFC2822String()`
- Manipulation: `add/sub` Seconds/Minutes/Hours/Days/Weeks/Months/Quarters/Years (all immutable)
- Period helpers: `startOf/endOf` Day/Week/Month/Quarter/Year/Hour/Minute
- Comparison: `isBefore`, `isAfter`, `isSame`, `isBetween`, `isToday`, `isWeekend`, `isFuture`, `isLeapYear`, and more
- Diffing: `diffInSeconds/Minutes/Hours/Days/Weeks/Months/Years` with float variants
- `diffForHumans()` with short/absolute options
- Multi-locale support: English, French, German, Spanish, Hindi, Japanese, Chinese
- `Carbon.range()` for generating date series
- `daysUntil()` instance method
- `closest()` and `farthest()` helpers
- `Carbon.setLocale()` / `.locale()` per-instance locale
- Automatic integration with ArikaJS view engine (`carbon()` and `Carbon` available in every template)
- `Carbon.isCarbon()` type guard
- Full TypeScript declaration files
- MIT License
