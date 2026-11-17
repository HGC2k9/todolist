# Graph Report - ToDoList  (2026-11-17)

## Corpus Check
- 38 files · ~51,724 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 3, .plist 2, .storyboard 2)

## Summary
- 250 nodes · 453 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e960806f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- index.ts
- AppDelegate
- with
- build.ts
- auth.ts
- compilerOptions
- types.ts
- scripts
- ref_node_assert
- Package.swift

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `scripts` - 13 edges
3. `escapeHtml()` - 11 edges
4. `runTests()` - 11 edges
5. `AppDelegate` - 10 edges
6. `formatVnDateTime()` - 10 edges
7. `runTests()` - 10 edges
8. `checkAndSendDailyBriefings()` - 9 edges
9. `verifyJWT()` - 8 edges
10. `sendTelegramMessage()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `calculateStreak()`  [EXTRACTED]
  test/v2_features.test.ts → src/telegram.ts
- `build()` --calls--> `renderHTML()`  [EXTRACTED]
  scripts/build.ts → src/frontend.ts
- `build()` --calls--> `renderServiceWorker()`  [EXTRACTED]
  scripts/build.ts → src/sw.ts
- `runTests()` --calls--> `generateSalt()`  [EXTRACTED]
  test/auth.test.ts → src/auth.ts
- `runTests()` --calls--> `hashPassword()`  [EXTRACTED]
  test/auth.test.ts → src/auth.ts

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (46): config, allowScripts, esbuild, sharp, workerd, dependencies, @capacitor/app@^8.1.2, @capacitor/camera@^8.2.6 (+38 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (40): getIconPNGBytes(), ICON_192_PNG_BASE64, ALLOWED_ORIGINS, app, checkAndSendDailyBriefings(), checkAndSendReminders(), ensureDbColumns(), getJwtSecret() (+32 more)

### Community 2 - "AppDelegate"
Cohesion: 0.09
Nodes (4): Capacitor, AppDelegate, SceneDelegate, UIKit

### Community 3 - "with"
Cohesion: 0.10
Nodes (19): name, runs-on, steps, jobs, build-ipa, name, on, push (+11 more)

### Community 4 - "build.ts"
Cohesion: 0.12
Nodes (9): fs, run(), sharp, build(), VENDOR_LIBS, renderHTML(), renderServiceWorker(), b64 (+1 more)

### Community 5 - "auth.ts"
Cohesion: 0.26
Nodes (17): base64UrlDecode(), base64UrlDecodeToBuffer(), base64UrlEncode(), base64UrlEncodeBuffer(), bufferToHex(), clearSessionCookie(), createJWT(), generateId() (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, jsxImportSource, lib, module, moduleResolution (+9 more)

### Community 7 - "types.ts"
Cohesion: 0.22
Nodes (15): escapeIcs(), exportTodosJson(), formatIcsDate(), generateIcs(), RFC-5545, validateAndParseImportJson(), parseTaskFromText(), CompletionHistory (+7 more)

### Community 8 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, cap:open, cap:sync, db:create, db:init:local, db:init:remote, db:migrate:remote (+5 more)

### Community 9 - "ref_node_assert"
Cohesion: 0.33
Nodes (4): run(), run(), test(), tests

## Knowledge Gaps
- **3 isolated node(s):** `PackageDescription`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hono` connect `package.json` to `index.ts`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **What connects `PackageDescription`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09941944847605225 - nodes in this community are weakly interconnected._
- **Should `AppDelegate` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `with` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._