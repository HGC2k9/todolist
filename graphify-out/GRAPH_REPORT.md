# Graph Report - ToDoList  (2026-11-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 245 nodes · 444 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ecc6870`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `scripts` - 13 edges
3. `escapeHtml()` - 11 edges
4. `runTests()` - 11 edges
5. `AppDelegate` - 10 edges
6. `formatVnDateTime()` - 10 edges
7. `runTests()` - 10 edges
8. `checkAndSendDailyBriefings()` - 9 edges
9. `sendOrUpdateTelegramTaskReminder()` - 8 edges
10. `sendTelegramMessage()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `calculateStreak()`  [EXTRACTED]
  test/v2_features.test.ts → src/telegram.ts
- `run()` --calls--> `getVnDateParts()`  [EXTRACTED]
  test/v3_features.test.ts → src/index.ts
- `runTests()` --calls--> `answerCallbackQuery()`  [EXTRACTED]
  test/telegram.test.ts → src/telegram.ts
- `run()` --calls--> `buildEveningBriefing()`  [EXTRACTED]
  test/v3_features.test.ts → src/telegram.ts
- `run()` --calls--> `buildMorningBriefing()`  [EXTRACTED]
  test/v3_features.test.ts → src/telegram.ts

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): config, allowScripts, esbuild, sharp, workerd, dependencies, @capacitor/camera@^8.2.6, @capacitor/cli@^8.6.0 (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (34): app, checkAndSendDailyBriefings(), checkAndSendReminders(), ensureDbColumns(), getVnDateParts(), resetRecurringTasks(), scheduled(), RFC-5545 (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (4): Capacitor, AppDelegate, SceneDelegate, UIKit

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (19): base64UrlDecode(), base64UrlDecodeToBuffer(), base64UrlEncode(), base64UrlEncodeBuffer(), bufferToHex(), clearSessionCookie(), createJWT(), generateId() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (9): fs, run(), sharp, build(), VENDOR_LIBS, renderHTML(), renderServiceWorker(), b64 (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): name, runs-on, steps, jobs, build-ios, name, on, push (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, jsxImportSource, lib, module, moduleResolution (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.24
Nodes (14): escapeIcs(), exportTodosJson(), formatIcsDate(), generateIcs(), RFC-5545, validateAndParseImportJson(), parseTaskFromText(), CompletionHistory (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (13): scripts, build, cap:open, cap:sync, db:create, db:init:local, db:init:remote, db:migrate:remote (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): run(), run(), test(), tests

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (3): getIconPNGBytes(), ICON_192_PNG_BASE64, generateIOSMobileConfig()

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `PackageDescription`, `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 88 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hono` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **What connects `RFC-5545`, `PackageDescription`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06236786469344609 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `Community 8` to `Community 0`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13937282229965156 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._