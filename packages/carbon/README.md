# @arikajs/carbon

> A fluent, expressive Date & Time library for ArikaJS — inspired by PHP's Carbon.

Every ArikaJS application deserves first-class date handling with zero configuration. `@arikajs/carbon` gives you an immutable, chainable, and timezone-aware `Carbon` class that feels exactly like PHP Carbon but runs natively in TypeScript/Node.js.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Creating Instances](#creating-instances)
- [Getters](#getters)
- [Formatting](#formatting)
- [Manipulation](#manipulation)
- [Start & End of Period](#start--end-of-period)
- [Comparison](#comparison)
- [Diffing (Difference)](#diffing-difference)
- [Human-Readable Diffs](#human-readable-diffs)
- [Ranges & Series](#ranges--series)
- [Timezone Support](#timezone-support)
- [Locale Support (Human Diffs)](#locale-support-human-diffs)
- [Immutability](#immutability)
- [ArikaJS View Integration](#arikajs-view-integration)
- [Static Helpers / Facade](#static-helpers--facade)
- [API Reference](#api-reference)

---

## Installation

`@arikajs/carbon` is bundled with ArikaJS. No extra installation needed.

```typescript
import { Carbon } from 'arikajs';
// or
import { Carbon } from '@arikajs/carbon';
```

---

## Quick Start

```typescript
import { Carbon } from 'arikajs';

// Create
const now = Carbon.now();
const birthday = Carbon.parse('1995-03-22');
const meeting = Carbon.create(2025, 6, 15, 14, 30, 0);

// Format
now.format('M j, Y');            // Mar 22, 2025
now.toDateString();              // 2025-03-22
now.toDateTimeString();          // 2025-03-22 14:30:00
now.toHumanString();             // March 22, 2025

// Manipulate (all immutable — returns a new Carbon)
birthday.addYears(30).format('Y');          // 2025
now.startOfMonth().format('M j, Y');        // Mar 1, 2025
now.addDays(7).subHours(2).toDateTimeString();

// Diff
birthday.diffInYears();                     // 30
now.diffForHumans();                        // "just now"
Carbon.parse('2025-01-01').diffForHumans(); // "3 months ago"

// Compare
now.isToday();    // true
now.isFuture();   // false
now.isPast();     // false
```

---

## Creating Instances

```typescript
// From current time
Carbon.now()                          // Current date + time
Carbon.today()                        // Today at 00:00:00
Carbon.yesterday()                    // Yesterday at 00:00:00
Carbon.tomorrow()                     // Tomorrow at 00:00:00

// From a value
Carbon.parse('2025-03-22')            // From ISO date string
Carbon.parse('2025-03-22 14:30:00')   // From date-time string
Carbon.parse(new Date())              // From JS Date
Carbon.parse(1742641800000)           // From Unix milliseconds

// Explicit creation
Carbon.create(2025, 3, 22)            // Year, Month (1-12), Day
Carbon.create(2025, 3, 22, 14, 30, 0) // + Hour, Minute, Second

// From Unix timestamp
Carbon.fromTimestamp(1742641800)      // Unix seconds
Carbon.fromMillis(1742641800000)      // Unix milliseconds

// Instance shorthand helper
carbon('2025-03-22')                  // Same as Carbon.parse()
carbon()                              // Same as Carbon.now()
```

---

## Getters

```typescript
const dt = Carbon.parse('2025-03-22 14:30:45');

dt.year          // 2025
dt.month         // 3  (1 = January)
dt.day           // 22
dt.hour          // 14
dt.minute        // 30
dt.second        // 45

dt.dayOfWeek     // 6  (0 = Sunday, 6 = Saturday)
dt.dayOfYear     // 81 (1-366)
dt.weekOfYear    // 12 (ISO week number)
dt.weekOfMonth   // 4
dt.daysInMonth   // 31
dt.quarter       // 1  (1-4)

dt.timestamp     // Unix timestamp in seconds
dt.milliseconds  // Unix timestamp in milliseconds
dt.toDate()      // Native JS Date object
```

---

## Formatting

Carbon uses a format string compatible with PHP's `date()` function:

```typescript
const dt = Carbon.parse('2025-03-22 14:30:45');

dt.format('Y-m-d')           // 2025-03-22
dt.format('d/m/Y')           // 22/03/2025
dt.format('M j, Y')          // Mar 22, 2025
dt.format('F j, Y')          // March 22, 2025
dt.format('l, F j, Y')       // Saturday, March 22, 2025
dt.format('D, d M Y')        // Sat, 22 Mar 2025
dt.format('H:i:s')           // 14:30:45
dt.format('h:i A')           // 02:30 PM
dt.format('Y-m-d H:i:s')     // 2025-03-22 14:30:45

// Shorthand formatters
dt.toDateString()             // 2025-03-22
dt.toDateTimeString()         // 2025-03-22 14:30:45
dt.toTimeString()             // 14:30:45
dt.toHumanString()            // March 22, 2025
dt.toShortDateString()        // Mar 22, 2025
dt.toISOString()              // 2025-03-22T14:30:45.000Z
dt.toRFC2822String()          // Sat, 22 Mar 2025 14:30:45 +0000
dt.toSlug()                   // 2025-03-22
dt.toString()                 // 2025-03-22 14:30:45
```

### Format Tokens

| Token | Example | Description |
|-------|---------|-------------|
| `Y` | 2025 | Full 4-digit year |
| `y` | 25 | 2-digit year |
| `m` | 03 | Month with leading zero (01-12) |
| `n` | 3 | Month without leading zero |
| `M` | Mar | 3-letter month abbreviation |
| `F` | March | Full month name |
| `d` | 22 | Day with leading zero (01-31) |
| `j` | 22 | Day without leading zero |
| `D` | Sat | 3-letter day abbreviation |
| `l` | Saturday | Full day name |
| `N` | 6 | Day of week (1=Mon, 7=Sun, ISO) |
| `w` | 6 | Day of week (0=Sun, 6=Sat) |
| `W` | 12 | ISO week number |
| `H` | 14 | Hour 24h with leading zero |
| `h` | 02 | Hour 12h with leading zero |
| `G` | 14 | Hour 24h without leading zero |
| `g` | 2 | Hour 12h without leading zero |
| `i` | 30 | Minutes with leading zero |
| `s` | 45 | Seconds with leading zero |
| `A` | PM | AM/PM uppercase |
| `a` | pm | am/pm lowercase |
| `U` | 1742641800 | Unix timestamp |
| `t` | 31 | Days in the month |
| `L` | 0 | Is leap year (1/0) |

---

## Manipulation

> All manipulation methods are **immutable** — they return a new `Carbon` instance and never modify the original.

```typescript
const dt = Carbon.parse('2025-03-22 14:30:00');

// Add
dt.addSeconds(30)
dt.addMinutes(15)
dt.addHours(2)
dt.addDays(7)
dt.addWeeks(2)
dt.addMonths(3)
dt.addQuarters(1)
dt.addYears(1)

// Subtract
dt.subSeconds(30)
dt.subMinutes(15)
dt.subHours(2)
dt.subDays(7)
dt.subWeeks(2)
dt.subMonths(3)
dt.subQuarters(1)
dt.subYears(1)

// Set specific unit
dt.setYear(2030)
dt.setMonth(12)
dt.setDay(1)
dt.setHour(9)
dt.setMinute(0)
dt.setSecond(0)

// Chaining
Carbon.now()
    .startOfMonth()
    .addDays(14)
    .setHour(9)
    .format('M j, Y h:i A');   // Mar 15, 2025 09:00 AM
```

---

## Start & End of Period

```typescript
const dt = Carbon.parse('2025-03-22 14:30:00');

// Day boundaries
dt.startOfDay()       // 2025-03-22 00:00:00
dt.endOfDay()         // 2025-03-22 23:59:59

// Week boundaries (Monday start by default)
dt.startOfWeek()      // 2025-03-17 00:00:00
dt.endOfWeek()        // 2025-03-23 23:59:59

// Month boundaries
dt.startOfMonth()     // 2025-03-01 00:00:00
dt.endOfMonth()       // 2025-03-31 23:59:59

// Quarter boundaries
dt.startOfQuarter()   // 2025-01-01 00:00:00
dt.endOfQuarter()     // 2025-03-31 23:59:59

// Year boundaries
dt.startOfYear()      // 2025-01-01 00:00:00
dt.endOfYear()        // 2025-12-31 23:59:59

// Hour/Minute boundaries
dt.startOfHour()      // 2025-03-22 14:00:00
dt.endOfHour()        // 2025-03-22 14:59:59
dt.startOfMinute()    // 2025-03-22 14:30:00
dt.endOfMinute()      // 2025-03-22 14:30:59
```

---

## Comparison

```typescript
const a = Carbon.parse('2025-03-22');
const b = Carbon.parse('2025-06-15');

// Boolean comparisons
a.isBefore(b)             // true
a.isAfter(b)              // false
a.isSameOrBefore(b)       // true
a.isSameOrAfter(b)        // false
a.isBetween(a, b)         // true (inclusive)
a.isSame(b)               // false
a.isSameDay(b)            // false
a.isSameMonth(b)          // false
a.isSameYear(b)           // true

// Relative to now
a.isToday()
a.isYesterday()
a.isTomorrow()
a.isThisWeek()
a.isThisMonth()
a.isThisYear()
a.isFuture()
a.isPast()

// Day-of-week helpers
a.isSunday()
a.isMonday()
a.isTuesday()
a.isWednesday()
a.isThursday()
a.isFriday()
a.isSaturday()
a.isWeekend()
a.isWeekday()

// Leap year
Carbon.parse('2024-01-01').isLeapYear()   // true
Carbon.parse('2025-01-01').isLeapYear()   // false

// Closest / farthest
a.closest(b, Carbon.now())   // Returns the Carbon closest to `a`
a.farthest(b, Carbon.now())  // Returns the Carbon farthest from `a`
```

---

## Diffing (Difference)

```typescript
const a = Carbon.parse('2025-01-01');
const b = Carbon.parse('2025-03-22');

// Signed (can be negative if a > b)
a.diffInSeconds(b)          // 6307200
a.diffInMinutes(b)          // 105120
a.diffInHours(b)            // 1752
a.diffInDays(b)             // 80
a.diffInWeeks(b)            // 11
a.diffInMonths(b)           // 2
a.diffInYears(b)            // 0

// Absolute (always positive, default)
a.diffInDays()              // vs Carbon.now() if no argument

// Float precision
a.diffInDaysFloat(b)        // 80.0
a.diffInHoursFloat(b)       // 1752.0
```

---

## Human-Readable Diffs

```typescript
Carbon.now().diffForHumans()                    // "just now"
Carbon.now().subSeconds(45).diffForHumans()     // "45 seconds ago"
Carbon.now().subMinutes(5).diffForHumans()      // "5 minutes ago"
Carbon.now().subHours(2).diffForHumans()        // "2 hours ago"
Carbon.now().subDays(1).diffForHumans()         // "1 day ago"
Carbon.now().subWeeks(2).diffForHumans()        // "2 weeks ago"
Carbon.now().subMonths(3).diffForHumans()       // "3 months ago"
Carbon.now().subYears(1).diffForHumans()        // "1 year ago"

Carbon.now().addHours(3).diffForHumans()        // "in 3 hours"
Carbon.now().addDays(2).diffForHumans()         // "in 2 days"

// Relative to another Carbon (not now)
const a = Carbon.parse('2020-01-01');
const b = Carbon.parse('2021-06-15');
a.diffForHumans(b)                              // "1 year before"

// Options
Carbon.now().subHours(3).diffForHumans({ short: true })  // "3h ago"
Carbon.now().subHours(3).diffForHumans({ absolute: true }) // "3 hours"
```

---

## Ranges & Series

```typescript
// Generate a range of dates between two Carbons
const range = Carbon.range(
    Carbon.parse('2025-03-01'),
    Carbon.parse('2025-03-07')
);
// → [Mar 1, Mar 2, Mar 3, Mar 4, Mar 5, Mar 6, Mar 7]

// With custom step
Carbon.range(
    Carbon.parse('2025-01-01'),
    Carbon.parse('2025-12-31'),
    'month'
);
// → [Jan 1, Feb 1, Mar 1, ... Dec 1]  (12 carbons)

// Periods
const period = Carbon.parse('2025-01-01').daysUntil('2025-01-07');
for (const day of period) {
    console.log(day.format('M j'));
}
```

---

## Timezone Support

```typescript
// Set timezone at creation
Carbon.now('Asia/Kolkata')
Carbon.parse('2025-03-22', 'America/New_York')

// Fluent timezone change
Carbon.now().setTimezone('Asia/Tokyo').toDateTimeString()

// Get UTC equivalent
Carbon.now('Asia/Kolkata').toUTC().toDateTimeString()

// Get timezone name
Carbon.now('Asia/Kolkata').timezone    // "Asia/Kolkata"
Carbon.now('Asia/Kolkata').offsetHours // +5.5
```

---

## Locale Support (Human Diffs)

```typescript
// Set global locale
Carbon.setLocale('hi');   // Hindi
Carbon.now().subHours(3).diffForHumans(); // "3 घंटे पहले"

Carbon.setLocale('en');   // English (default)
Carbon.setLocale('fr');   // French
Carbon.setLocale('de');   // German
Carbon.setLocale('es');   // Spanish
Carbon.setLocale('ja');   // Japanese
Carbon.setLocale('zh');   // Chinese

// Per-instance locale
Carbon.now().locale('hi').diffForHumans();
```

---

## Immutability

Every `Carbon` instance is **immutable**. All manipulation methods return a **new** `Carbon` instance — the original is never changed.

```typescript
const original = Carbon.parse('2025-03-22');
const modified = original.addDays(7);

original.toDateString();   // 2025-03-22  ← unchanged
modified.toDateString();   // 2025-03-29  ← new instance
```

---

## ArikaJS View Integration

`@arikajs/carbon` is automatically integrated into the ArikaJS view engine. The `carbon()` helper function is available in **every template** with zero configuration:

```blade
{{-- Create and format --}}
{{ carbon(task.created_at).format('M j, Y') }}
{{ carbon(task.created_at).diffForHumans() }}
{{ carbon(task.due_date).toHumanString() }}

{{-- Comparisons in templates --}}
@if(carbon(task.due_date).isPast())
    <span class="overdue">Overdue</span>
@endif

@if(carbon(task.due_date).isToday())
    <span class="due-today">Due Today</span>
@endif

{{-- Relative ranges --}}
@foreach(Carbon.range(carbon(board.start_date), carbon(board.end_date)) as day)
    <div>{{ day.format('d M') }}</div>
@endforeach
```

---

## Static Helpers / Facade

Available globally in all ArikaJS templates and accessible anywhere:

```typescript
import { Carbon, carbon } from 'arikajs';

// Function helper (convenience)
carbon()                    // Carbon.now()
carbon('2025-03-22')        // Carbon.parse('2025-03-22')
carbon(new Date())          // Carbon.parse(new Date())

// Static class methods
Carbon.now()
Carbon.today()
Carbon.yesterday()
Carbon.tomorrow()
Carbon.parse(value)
Carbon.create(y, m, d, h?, i?, s?)
Carbon.fromTimestamp(seconds)
Carbon.fromMillis(ms)
Carbon.range(from, to, unit?)
Carbon.setLocale(locale)
Carbon.getLocale()
Carbon.isCarbon(value)      // Type guard
```

---

## API Reference

### Constructor & Parsing
| Method | Returns | Description |
|--------|---------|-------------|
| `Carbon.now(tz?)` | `Carbon` | Current date & time |
| `Carbon.today(tz?)` | `Carbon` | Today at 00:00:00 |
| `Carbon.yesterday(tz?)` | `Carbon` | Yesterday at 00:00:00 |
| `Carbon.tomorrow(tz?)` | `Carbon` | Tomorrow at 00:00:00 |
| `Carbon.parse(value, tz?)` | `Carbon` | From string / Date / ms |
| `Carbon.create(y,m,d,h?,i?,s?)` | `Carbon` | Explicit construction |
| `Carbon.fromTimestamp(s)` | `Carbon` | From Unix seconds |
| `Carbon.fromMillis(ms)` | `Carbon` | From Unix milliseconds |

### Manipulation
| Method | Returns | Description |
|--------|---------|-------------|
| `addSeconds/Minutes/Hours/Days/Weeks/Months/Quarters/Years(n)` | `Carbon` | Add time |
| `subSeconds/Minutes/Hours/Days/Weeks/Months/Quarters/Years(n)` | `Carbon` | Subtract time |
| `setYear/Month/Day/Hour/Minute/Second(n)` | `Carbon` | Set unit |
| `startOfDay/Week/Month/Quarter/Year/Hour/Minute()` | `Carbon` | Period start |
| `endOfDay/Week/Month/Quarter/Year/Hour/Minute()` | `Carbon` | Period end |
| `setTimezone(tz)` | `Carbon` | Change timezone |
| `toUTC()` | `Carbon` | Convert to UTC |

### Formatting
| Method | Returns | Description |
|--------|---------|-------------|
| `format(fmt)` | `string` | PHP-style format string |
| `toDateString()` | `string` | `YYYY-MM-DD` |
| `toDateTimeString()` | `string` | `YYYY-MM-DD HH:mm:ss` |
| `toTimeString()` | `string` | `HH:mm:ss` |
| `toHumanString()` | `string` | `March 22, 2025` |
| `toShortDateString()` | `string` | `Mar 22, 2025` |
| `toISOString()` | `string` | ISO 8601 |
| `toRFC2822String()` | `string` | RFC 2822 |
| `toSlug()` | `string` | `2025-03-22` |
| `diffForHumans(other?, opts?)` | `string` | "3 hours ago" |

### Comparison
| Method | Returns | Description |
|--------|---------|-------------|
| `isBefore(other)` | `boolean` | Strict before |
| `isAfter(other)` | `boolean` | Strict after |
| `isSame(other)` | `boolean` | Same millisecond |
| `isSameDay/Month/Year(other)` | `boolean` | Same period |
| `isBetween(from, to)` | `boolean` | Inclusive check |
| `isToday/Yesterday/Tomorrow()` | `boolean` | Relative to now |
| `isFuture/isPast()` | `boolean` | Relative to now |
| `isWeekend/isWeekday()` | `boolean` | Day type check |
| `isLeapYear()` | `boolean` | Leap year check |

### Diffing
| Method | Returns | Description |
|--------|---------|-------------|
| `diffInSeconds/Minutes/Hours/Days/Weeks/Months/Years(other?)` | `number` | Signed integer diff |
| `diffInDaysFloat/HoursFloat(other?)` | `number` | Float precision diff |
