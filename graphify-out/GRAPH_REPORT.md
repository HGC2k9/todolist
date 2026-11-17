# Graph Report - ToDoList  (2026-11-17)

## Corpus Check
- 119 files · ~273,621 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 66 file(s) not represented in the graph (top: .csv 53, (none) 3, .plist 2)
- WARNING: 66 of 256 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1455 nodes · 2561 edges · 72 communities (51 shown, 21 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a2589895`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- index.ts
- AppDelegate
- validate_data.py
- build.ts
- with
- compilerOptions
- ShadcnInstaller
- scripts
- scripts/core.py
- re
- Package.swift
- gray
- color
- cip/core.py
- button
- slide_search_core.py
- spacing
- design_system.py
- test_data_contracts.py
- DesignSystemGenerator
- test_core.py
- pathlib
- sys
- test_design_system_mode.py
- generate-slide.py
- TestTailwindConfigGenerator
- TestStyleTaxonomy
- json
- test_relevance_evaluator.py
- .generate
- fontSize
- extract-colors.cjs
- csv
- CatalogRefreshTest
- dependencies
- validate-asset.cjs
- TailwindConfigGenerator
- TestWebStackFreshness
- .test_node_check_parses_generated_config
- TestDomainDetection
- TestSearchDomains
- render-html.py
- validate-tokens.cjs
- test_text_layout_resilience.py
- inject-brand-context.cjs
- embed-tokens.cjs
- primitive
- TestNativeDesktopStackFreshness
- sync-brand-to-tokens.cjs
- generate-tokens.cjs
- cip/search.py
- radius
- logo/search.py
- shadow
- lg
- xl
- md
- none
- @capacitor/cli
- allowScripts
- @capacitor/core@^8.6.0
- ref_fs
- @capacitor/status-bar@^8.0.4

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `TestTailwindConfigGenerator` - 35 edges
3. `DesignSystemGenerator` - 35 edges
4. `ShadcnInstaller` - 34 edges
5. `TestShadcnInstaller` - 26 edges
6. `read_rows()` - 16 edges
7. `color` - 15 edges
8. `search()` - 15 edges
9. `CatalogRefreshTest` - 15 edges
10. `TestReasoningContract` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agent/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agent/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agent/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agent/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestReasoningContract` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agent/skills/ui-ux-pro-max/scripts/tests/test_data_contracts.py → .agent/skills/ui-ux-pro-max/scripts/design_system.py
- `build()` --calls--> `renderHTML()`  [EXTRACTED]
  scripts/build.ts → src/frontend.ts
- `build()` --calls--> `renderServiceWorker()`  [EXTRACTED]
  scripts/build.ts → src/sw.ts

## Import Cycles
- None detected.

## Communities (72 total, 21 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.18
Nodes (14): devDependencies, @cloudflare/workers-types@^4.20241106.0, @playwright/test@^1.65.1, tsx@^4.23.15, typescript@^5.6.0, wrangler@^3.91.0, name, private (+6 more)

### Community 1 - "index.ts"
Cohesion: 0.06
Nodes (76): base64UrlDecode(), base64UrlDecodeToBuffer(), base64UrlEncode(), base64UrlEncodeBuffer(), bufferToHex(), clearSessionCookie(), createJWT(), generateId() (+68 more)

### Community 2 - "AppDelegate"
Cohesion: 0.09
Nodes (4): Capacitor, AppDelegate, SceneDelegate, UIKit

### Community 3 - "validate_data.py"
Cohesion: 0.06
Nodes (43): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, TestGeneratedCatalogContract, _catalog_date(), _check_app_interface_contract() (+35 more)

### Community 4 - "build.ts"
Cohesion: 0.16
Nodes (7): fs, run(), sharp, build(), VENDOR_LIBS, renderHTML(), renderServiceWorker()

### Community 5 - "with"
Cohesion: 0.10
Nodes (20): name, runs-on, steps, jobs, build-ios, name, on, push (+12 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, jsxImportSource, lib, module, moduleResolution (+9 more)

### Community 7 - "ShadcnInstaller"
Cohesion: 0.05
Nodes (3): main(), ShadcnInstaller, TestShadcnInstaller

### Community 8 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, cap:open, cap:sync, db:create, db:init:local, db:init:remote, db:migrate:remote (+5 more)

### Community 9 - "scripts/core.py"
Cohesion: 0.06
Nodes (31): BM25, _contains_phrase(), detect_domain(), _domain_keywords(), _exact_match_diagnostic(), _exact_row_identity(), _exact_stack_identifier(), _file_signature() (+23 more)

### Community 10 - "re"
Cohesion: 0.06
Nodes (25): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+17 more)

### Community 13 - "gray"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 14 - "color"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 15 - "cip/core.py"
Cohesion: 0.06
Nodes (13): BM25, detect_domain(), get_cip_brief(), _load_csv(), search(), search_all(), _search_csv(), BM25 (+5 more)

### Community 16 - "button"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 17 - "slide_search_core.py"
Cohesion: 0.08
Nodes (17): format_context(), format_result(), main(), BM25, calculate_pattern_break(), detect_domain(), get_background_config(), get_color_for_emotion() (+9 more)

### Community 18 - "spacing"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 19 - "design_system.py"
Cohesion: 0.08
Nodes (12): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi(), persist_design_system() (+4 more)

### Community 20 - "test_data_contracts.py"
Cohesion: 0.10
Nodes (11): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), read_rows(), split_values(), style_identities(), TestLandingAndStackContract (+3 more)

### Community 21 - "DesignSystemGenerator"
Cohesion: 0.13
Nodes (3): DesignSystemGenerator, TestReasoningMatch, TestEndToEndCoherence

### Community 22 - "test_core.py"
Cohesion: 0.08
Nodes (6): format_markdown(), generate_design_system(), TestBm25CoreBehavior, TestDiagnosticsContracts, TestPersistence, TestTokenizer

### Community 23 - "pathlib"
Cohesion: 0.15
Nodes (5): test_sync_parses_bundled_starter_template(), main(), _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 24 - "sys"
Cohesion: 0.14
Nodes (8): build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main(), main()

### Community 25 - "test_design_system_mode.py"
Cohesion: 0.15
Nodes (7): _contrast_ratio(), _derive_dark_palette(), _palette_is_dark(), _relative_luminance(), _select_palette_for_mode(), TestLuminance, TestPaletteSelection

### Community 26 - "generate-slide.py"
Cohesion: 0.13
Nodes (11): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+3 more)

### Community 28 - "TestStyleTaxonomy"
Cohesion: 0.11
Nodes (5): _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution, TestStyleTaxonomy

### Community 29 - "json"
Cohesion: 0.16
Nodes (9): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+1 more)

### Community 30 - "test_relevance_evaluator.py"
Cohesion: 0.12
Nodes (3): TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 31 - ".generate"
Cohesion: 0.13
Nodes (3): _filter_anti_patterns_for_mode(), _resolve_dial(), TestAntiPatternGating

### Community 32 - "fontSize"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 34 - "extract-colors.cjs"
Cohesion: 0.20
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 37 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @capacitor/camera@^8.2.6, @capacitor/geolocation@^8.2.4, @capacitor/ios@^8.6.0, @capacitor/preferences@^8.0.1, @capacitor/splash-screen@^8.0.2, @capgo/capacitor-updater@^8.54.2, hono@^4.6.0 (+7 more)

### Community 38 - "validate-asset.cjs"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 44 - "render-html.py"
Cohesion: 0.23
Nodes (4): generate_html(), get_deliverable_info(), get_image_base64(), main()

### Community 45 - "validate-tokens.cjs"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 46 - "test_text_layout_resilience.py"
Cohesion: 0.18
Nodes (3): read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 47 - "inject-brand-context.cjs"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 48 - "embed-tokens.cjs"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 49 - "primitive"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 51 - "sync-brand-to-tokens.cjs"
Cohesion: 0.29
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 52 - "generate-tokens.cjs"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 55 - "cip/search.py"
Cohesion: 0.32
Nodes (3): format_brief(), format_results(), main()

### Community 56 - "radius"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 61 - "shadow"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 63 - "lg"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 64 - "xl"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 65 - "md"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 66 - "none"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 67 - "@capacitor/cli"
Cohesion: 0.50
Nodes (3): config, @capacitor/cli@^8.6.0, @capacitor/cli

### Community 68 - "allowScripts"
Cohesion: 0.50
Nodes (4): allowScripts, esbuild, sharp, workerd

### Community 69 - "@capacitor/core@^8.6.0"
Cohesion: 0.33
Nodes (4): @capacitor/core@^8.6.0, capacitor-voice-recorder@^7.0.6, @capacitor/core, capacitor-voice-recorder

## Knowledge Gaps
- **3 isolated node(s):** `PackageDescription`, `RFC-5545`, `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 599 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TailwindConfigGenerator` connect `TailwindConfigGenerator` to `.generate_config_string`, `.test_node_check_parses_generated_config`, `._base_config`, `.test_full_configuration_typescript`, `pathlib`, `sys`, `.write_config`, `.add_colors`, `TestTailwindConfigGenerator`, `.add_plugins`, `.recommend_plugins`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PackageDescription`, `RFC-5545`, `RFC-5545` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056806227645697455 - nodes in this community are weakly interconnected._
- **Why does `ShadcnInstaller` connect `ShadcnInstaller` to `sys`, `pathlib`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `AppDelegate` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._