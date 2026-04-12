---
"@arikajs/view": patch
"@arikajs/arikajs": patch
"@arikajs/cli": patch
"@arikajs/logging": patch
"@arikajs/benchmark": patch
---

- fix(view): resolve HMR duplicate watchers by adding CLI bootstrap detection
- fix(view): resolve component AST parsing issues in CodeGenerator
- fix(logging): safely handle missing config contexts in LogManager
- fix(cli): optimize process isolation between CLI and server
- perf: standardized benchmark suite and optimized warp drive routing
