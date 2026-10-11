# Verification receipt

Workspace: `/Users/danielpetro/Documents/Codex/2026-10-10/task-3`. Node 25.8.1/npm 11.11.0 for generation/npm tests; vendor Node 26.11.1 for Bazel. No existing products edited.

CLI suite: 47 passing tests, including unsafe paths/args, existing targets, dry-run, registry/offline failures, incompatible/malformed/missing peers and engines, unsupported adapter majors, exact Effect 4.0.2/platform-node 4.0.3 compatibility, supporting dependency constraints, TanStack/shadcn source integrity/config injection, bundled archive/manifest validation, WorkOS peer selection and exact prerelease gates. Independent source review found no remaining material findings in the reviewed scope and independently reran all 47 CLI tests. The solver's deterministic priority was also checked against exhaustive enumeration of 100 synthetic graphs.

## Current TanStack Start + Convex + WorkOS proof

Result: **Passed**, recorded 2026-10-10T12:17:51.103Z. Fresh live generation: true. Clean sample: samples/auth-demo. Official command: npm create convex@latest my-app -- -t tanstack-start-authkit. Official source: https://github.com/get-convex/templates/tree/59d5f70771deb5480aa73d133039d8b767827b63/template-tanstack-start-authkit; Git tree b551b5ed78a4dc952c4f1b3c4459019edcfa468a. Source blobs are verified as data; downloaded executable configuration and initialization scripts are never executed/copied. Current upstream structure and dependency guards fail on unsupported drift.

Generator command: node src/cli.mjs create auth-app --preset tanstack-convex-workos --tanstack-runtime rc --e2e. Install is separate: node src/cli.mjs install auth-app. --bazel is explicitly rejected; Effect/Confect integration is not claimed for this preset.

| Check | Result | Receipt |
|---|---|---|
| dry-run | Passed (exit 0) | tanstack-dry-run.txt |
| generation | Passed (exit 0) | tanstack-generation.txt |
| existing-refused | Passed (exit 1) | tanstack-existing-refused.txt |
| bazel-refused | Passed (exit 1) | tanstack-bazel-refused.txt |
| runtime-selection-required | Passed (exit 1) | tanstack-runtime-selection-required.txt |
| install | Passed (exit 0) | tanstack-install.txt |
| install-repeat | Passed (exit 0) | tanstack-install-repeat.txt |
| install-dry-run | Passed (exit 0) | tanstack-install-dry-run.txt |
| shadcn-add-plan | Passed (exit 0) | tanstack-shadcn-add-plan.txt |
| typecheck | Passed (exit 0) | tanstack-typecheck.txt |
| unit | Passed (exit 0) | tanstack-unit.txt |
| build | Passed (exit 0) | tanstack-build.txt |
| tree | Passed (exit 0) | tanstack-tree.txt |
| config-prerequisite | Passed (exit 2) | tanstack-config-prerequisite.txt |
| backend-prerequisite | Passed (exit 2) | tanstack-backend-prerequisite.txt |
| ui | Passed (exit 0) | tanstack-ui.txt |
| server-missing | Passed (exit 0) | tanstack-server-missing.txt |
| synthetic-build | Passed (exit 0) | tanstack-synthetic-build.txt |
| server-synthetic | Passed (exit 0) | tanstack-server-synthetic.txt |
| build-restored | Passed (exit 0) | tanstack-build-restored.txt |
| tailwind-css | Passed (exit 0) | tanstack-verification.json |
| production-preview | Passed (exit 0) | tanstack-verification.json |

Fresh strict npm installation created and verified an npm v3 lock; repeat install preserved its bytes. Actual tsr route codegen, full TypeScript, eight unit tests, frontend/server build, dependency tree and deterministic browser smoke passed. Production Vite/Start SSR preview returned the real setup page with private, no-store caching. Missing configuration and Convex deployment prerequisites exited 2 as expected, before provisioning/backend codegen. These expected failures are counted as passing fail-closed checks, not successful cloud setup.

Built-handler probes use the actual emitted Start server and AuthKit SDK. A global fetch guard recorded zero attempted outbound requests. Missing setup returns sign-in/callback 503; cross-site server functions return 403; protected routes redirect safely. Synthetic configuration exercised a real SDK-generated PKCE cookie and authorization redirect, missing-code callback failure, tampered-cookie failure and mismatched-origin 400. Only cookie names and redacted authorization query values are recorded. No authorization URL was followed, valid authorization code exchanged, credentials retrieved or deployed backend contacted. Client bundles were scanned for server-secret identifiers/fixture values.

Request-scoped router/Convex/query clients and minimal public session projection prevent SSR auth state reuse. Tokens are applied to the request HTTP client, cleared for absent users and excluded from route context. Convex's actual emulator verifies anonymous rejection and two synthetic identity results, not JWT signature/issuer verification. AuthKit controls session APIs; the adapter rechecks on focus and each visible minute because SDK 0.11.1's normal expiry path does not always call onSessionExpired. Unit tests verify the transition policy; real live expiry remains unverified.

Inspected UI: receipts/tanstack-auth-setup-required.png, 1280×900, SHA256 b401eab71431a51030911e666110908ca7e86b707fcc16dd547d5e6eed503771. The generated-app preview says Scaffolding is complete, with optional app sign-in setup, disabled unconfigured sign-in, protected-route check and real shadcn Button/Card/Input. The browser uses Tab to verify anchor semantics, 3px visible link focus, labelled Input focus, button focus ring and Enter validation; then previews a synthetic local label and checks the protected route. Controls remain disabled until React hydration attaches handlers, preventing native early form submission. Its actual deterministic browser report is tanstack-ui-report.json. This screenshot is included in the updated source archive and is ready to replace the same auth Library screenshot item with a version guard; the original two vanilla screenshot Library items remain unchanged. Independent review covers source, archive validation and inspected image.

### Current shadcn integration

Current official setup: https://ui.shadcn.com/docs/installation/tanstack and https://ui.shadcn.com/docs/installation/manual. Tailwind Vite setup: https://tailwindcss.com/docs/installation/using-vite. The React preset includes current base-nova registry Button/Card/Input, exact audited executable SHA256 checks and fixed local targets. Registry changes, new dependency surfaces, extra files/targets or environment/config/CSS mutations fail. No shadcn init/add runs during generation or installation. MIT attribution is included. components.json is complete with rsc false, src/app.css, aligned @ aliases and lucide; cn helper, Tailwind/plugin, theme mappings and animation/shadcn imports are configured. Vanilla presets stay vanilla.

Future additions: npm run ui:add -- badge --dry-run (tested non-mutating) followed by deliberate npm run ui:add -- badge without --overwrite. The recorded local upstream CLI may modify app files/package/lock and install dependencies; review its diff. Changed dependency roots are app-owned and intentionally outside subsequent strict scaffolder install. Current cn 0.2.6 is compatible with shadcn's ^0.2.4; latest 0.4.0 is not. This below-latest selection is disclosed alongside WorkOS's Node peer choice.

Tailwind 4.3.3's optional official WASM archive bundles six stable packages. Their collective parent SHA512 is checked, then bounded data-only tar parsing rejects unsafe paths, links, duplicate/nested packages and excessive sizes. Parent declaration, exact child set, versions and dependency/optional/peer/engine/platform/bin metadata and dependency edges must match the lock. Proof is recreated before npm ci, in repeat/existing-lock plans and after installation; scripts stay disabled. Only the reviewed parent4.3.3 is supported; other bundles fail explicitly, and Bazel translation refuses bundled graphs. The first strict bundle refusal is retained as tanstack-shadcn-install-attempt1-bundles.txt. A browser test exposed early native form submission before hydration; source controls were fixed and the passing final browser receipt includes keyboard interactions. The initial failure is retained as tanstack-shadcn-ui-attempt1-hydration.txt.

### Exact TanStack/AuthKit versions

| Package | Selected | Latest eligible |
|---|---|---|
| convex | 1.46.0 | 1.46.0 |
| @tanstack/react-start | 1.168.61 | 1.168.61 |
| @workos/authkit-tanstack-react-start | 0.11.1 | 0.11.1 |
| @workos-inc/node | 10.14.0 | 11.0.0 |
| @tanstack/react-router | 1.170.42 | 1.170.42 |
| @tanstack/react-router-ssr-query | 1.167.3 | 1.167.3 |
| @tanstack/react-query | 5.104.1 | 5.104.1 |
| @tanstack/query-core | 5.104.1 | 5.104.1 |
| @convex-dev/react-query | 0.1.0 | 0.1.0 |
| react | 19.3.0 | 19.3.0 |
| react-dom | 19.3.0 | 19.3.0 |
| @base-ui/react | 1.9.0 | 1.9.0 |
| cn | 0.2.6 | 0.4.0 |
| class-variance-authority | 0.7.1 | 0.7.1 |
| lucide-react | 1.55.0 | 1.55.0 |
| tw-animate-css | 1.4.0 | 1.4.0 |
| vite | 8.3.4 | 8.3.4 |
| typescript | 7.0.2 | 7.0.2 |
| @types/node | 26.6.5 | 26.6.5 |
| tsx | 4.23.15 | 4.23.15 |
| convex-test | 0.0.61 | 0.0.61 |
| @tanstack/router-cli | 1.167.41 | 1.167.41 |
| @vitejs/plugin-react | 6.1.2 | 6.1.2 |
| vite-tsconfig-paths | 6.1.1 | 6.1.1 |
| dotenv | 18.0.7 | 18.0.7 |
| @types/react | 19.3.0 | 19.3.0 |
| @types/react-dom | 19.3.0 | 19.3.0 |
| tailwindcss | 4.3.3 | 4.3.3 |
| @tailwindcss/vite | 4.3.3 | 4.3.3 |
| shadcn | 4.21.4 | 4.21.4 |
| e2e | 0.19.0 | 0.19.0 |
| @e2e-dev/web | 0.14.0 | 0.14.0 |
| create-convex | 0.0.47 | 0.0.47 |

WorkOS Node 10.14.0 is the newest compatible release: latest 11.0.0 violates AuthKit 0.11.1's ^10.7.0 peer. This is disclosed by diagnostics and the receipt. Explicit --tanstack-runtime rc permits exactly h3-v2/H3 2.0.1-rc.20 (required by stable Start) and Babel's gensync 1.0.0-beta.2. The lock contains only these two prerelease exceptions; no general prerelease permission or forced peer resolution. Missing selection and different versions fail. npm lifecycle scripts remain disabled.

React is the official TanStack Start/AuthKit frontend integration; it is separate from the lightweight vanilla Effect presets. WorkOS account/application setup and Convex deployment WORKOS_CLIENT_ID are manual prerequisites. The upstream router circular-dependency warning and tsconfig-path plugin deprecation warning are maintenance signals; current tests pass. Supported API adapters still need maintenance as versions change.

## Current fresh live compatibility proof

Result: **Passed**, recorded 2026-10-10T10:31:22.698Z. Generated `samples/alchemy-compatible` with Alchemy beta explicitly selected, Bazel and e2e configured. Current official registry metadata; no snapshot replay (false); started with no existing lockfile. Dry-run left no destination (true).

| Check | Result | Receipt |
|---|---|---|
| dry-run | Passed (exit 0) | compatible-dry-run.txt |
| generation | Passed (exit 0) | compatible-generation.txt |
| install | Passed (exit 0) | compatible-install.txt |
| typecheck | Passed (exit 0) | compatible-typecheck.txt |
| unit | Passed (exit 0) | compatible-unit.txt |
| build | Passed (exit 0) | compatible-build.txt |
| local-plan | Passed (exit 0) | compatible-local-plan.txt |
| worker-kv | Passed (exit 0) | compatible-worker-kv.txt |
| tree | Passed (exit 0) | compatible-tree.txt |
| bazel-setup | Passed (exit 0) | compatible-bazel-setup.txt |
| bazel-build | Passed (exit 0) | compatible-bazel-build.txt |
| bazel-test | Passed (exit 0) | compatible-bazel-test.txt |
| bazel-incremental | Passed (exit 0) | compatible-bazel-incremental.txt |

The fresh installer created an npm v3 lock, verified exact direct archives and the full graph's sources/prereleases, performed npm ci with strict peers/engines and scripts disabled, and passed npm ls --all. No historical lock, overrides, --force or legacy-peer-deps was used. npm checks include full TypeScript, unit tests and Vite build. Actual upstream Alchemy local providers and workerd ran Worker/KV PUT/GET and the Effect greeting; local plan used fresh local state. Bazel emitted real frontend and Worker ES bundles and passed unit/typecheck targets; unchanged builds reused actions. e2e is configured and typechecked in this new sample; no additional browser run is claimed.

### Transparent compatible selections

Every generation fetches full release metadata and searches stable candidates within reviewed adapters in recorded selectionOrder (newest domain/backend first, supporting packages next, development tools last). It validates peers, selected-package dependency edges and Node/npm engines. Below-latest selections are printed and recorded with reasons. Unsupported latest API majors/betas still fail rather than silently choosing an older API. No compatible combination, malformed metadata or exhausted bounded search fails explicitly before writing.

| Package | Selected | Latest eligible / dist-tag latest | Reason |
|---|---|---|---|
| @effect/platform-node | 4.0.2 | 4.0.3 / 4.0.3 | peer: @effect/platform-node@4.0.3 requires effect ^4.0.3; selected 4.0.2; dependency: @effect/platform-node@4.0.3 requires @effect/platform-node-shared ^4.0.3; selected 4.0.2 |
| @effect/platform-node-shared | 4.0.2 | 4.0.3 / 4.0.3 | peer: @effect/platform-node-shared@4.0.3 requires effect ^4.0.3; selected 4.0.2 |
| @effect/sql-d1 | 4.0.2 | 4.0.3 / 4.0.3 | peer: @effect/sql-d1@4.0.3 requires effect ^4.0.3; selected 4.0.2 |
| @effect/sql-sqlite-do | 4.0.2 | 4.0.3 / 4.0.3 | peer: @effect/sql-sqlite-do@4.0.3 requires effect ^4.0.3; selected 4.0.2 |

Stable Effect latest is 4.0.2. The four support packages' latest 4.0.3 releases require Effect ^4.0.3, so their newest compatible 4.0.2 releases are exact roots. These support packages are already upstream dependencies/peers; no SQL feature is added to the demo. Strict npm resolution validates the remaining transitive graph. The first fresh install exposed the SQL peer closure and failed safely; compatible-install-attempt1-transitive-peer.txt preserves that failure. The final fresh generation and installation passed after adding those supporting packages to the reviewed set.

### Actual bundle outputs

| Path | Bytes | SHA256 |
|---|---|---|
| assets/index-DYYiu8_G.css | 1419 | d14034ffb189b90eb752eacd4b6653166b706e6b427196b3fa71f2e503c8a333 |
| assets/index-H3p8s-3Z.js | 22505 | fcfb59186a3dd1a52bed4163a14c40a0989ba5c27949feddb9f25739a967354e |
| index.html | 417 | 40a9b8e3d36b410033ad258e8b09c65670cbb060f451aa503cb6255e311357da |
| worker/main.js | 29947 | ac3624bcb026a569566628aae692a41fa93e3f3714f96682d20b2cefc9ee7003 |

## Earlier infrastructure matrix (historical evidence)

| Generated sample | Preset | Bazel | e2e configured | Actual checks |
|---|---|---|---|---|
| alchemy-bazel-ui | cloudflare-alchemy | yes | yes | Passed |
| alchemy-bazel | cloudflare-alchemy | yes | no | Passed |
| alchemy-demo | cloudflare-alchemy | no | no | Passed |
| alchemy-ui | cloudflare-alchemy | no | yes | Passed |
| confect-bazel-ui | convex-confect | yes | yes | Passed |
| confect-bazel | convex-confect | yes | no | Passed |
| effect-bazel-ui | convex-effect | yes | yes | Passed |
| effect-bazel | convex-effect | yes | no | Passed |

The four Convex/Confect variants were generated live. The four earlier Alchemy variants explicitly replayed an earlier coherent snapshot under the previous latest-only resolver. Those historical manifests predate the new support roots; their own locked npm ci reproduces them. They are not current live-generation proofs or production fallbacks. Test-only replay scripts are never imported by the generator. Earlier latest-only PEER rejection receipts are superseded by the current passing compatibility proof above.

All eight passed strict npm installation, full typecheck, unit tests, frontend build and tree checks. All four earlier Alchemy samples passed real local Worker/KV. Confect variants passed actual upstream codegen. Six Bazel combinations passed real bundles, unit/typecheck targets, unchanged cache reuse, source invalidation with changed hashes and restored builds/tests. Confect codegen is a real upstream action dependency. Alchemy emits Worker ES bundles. Infrastructure emulation and cloud operations remain outside pure Bazel actions.

Additional UI-input negative proof: Passed. A temporary TypeScript error in tests/demo.e2e.ts caused actual Bazel typecheck to fail with TS2322/TS6133, exit 3; restoration passed. The harness initially expected exit 1; original outputs/exits are retained. This executes a typechecker, not a browser/model test.

An initial Alchemy Bazel attempt exhausted disk while duplicating unnecessary SDK inputs. Narrowing pure-action dependency inputs and removing the separate npm node_modules before Bazel resolved the footprint; the failure receipt is retained. Caches, dependencies and ephemeral state were removed after verification for disk space; exact npm/pnpm/module lockfiles remain.

## Original UI evidence

Original convex-effect and convex-confect samples passed actual upstream Confect codegen where applicable, full typechecks/builds, two registered Convex query tests each and one deterministic tester-army/e2e browser smoke each. Inspected 1280×900 screenshots are preserved unchanged in their original Library items. Original aggregate passed: true. New infrastructure variants configure/typecheck e2e; no new browser execution or screenshot is claimed.

## Exact tested direct/tool versions

Current live Alchemy versions take precedence here; Convex/Confect versions come from the earlier live matrix. Full per-sample metadata, selected/latest comparisons, archives and lockfiles are included.

| Package | Version |
|---|---|
| @alchemy.run/cloudflare-runtime | 2.0.0-beta.81 |
| @confect/cli | 10.2.0 |
| @confect/core | 10.2.0 |
| @confect/server | 10.2.0 |
| @distilled.cloud/cloudflare | 1.0.0-rc.13 |
| @e2e-dev/web | 0.14.0 |
| @effect/platform-node | 4.0.2 |
| @effect/platform-node-shared | 4.0.2 |
| @effect/sql-d1 | 4.0.2 |
| @effect/sql-sqlite-do | 4.0.2 |
| @types/node | 26.6.5 |
| alchemy | 2.0.0-beta.81 |
| convex | 1.46.0 |
| convex-test | 0.0.61 |
| create-vite | 9.2.1 |
| e2e | 0.19.0 |
| effect | 4.0.2 |
| redis | 6.3.0 |
| tsx | 4.23.15 |
| typescript | 7.0.2 |
| vite | 8.3.4 |

Bazel 9.3.0; aspect_rules_js 3.5.1; rules_nodejs 6.7.6; Node toolchain 26.11.1. Official vendor hashes, module source integrity and Node archive SHA256 manifest are recorded per sample. Ordinary packages are stable. Alchemy/runtime beta.81 are explicitly selected; the mandatory Cloudflare RC peer and narrowly reviewed transitive ecosystem prereleases are enumerated in src/resolve.mjs and locked, never enabled globally.

## Boundaries and gaps

Convex deployment-backed codegen needs absent deployment prerequisites: expected exit 2 before upstream execution, not passed cloud codegen. convex-test is an in-process emulator. The original inspected UI proves labelled local Effect mode; the new auth UI proves setup-required SSR and synthetic SDK failure flows; Alchemy proves real local Worker/KV only. No deployments/provisioning, credential changes, real data, model spend, global installs, pushes or publication. Local tooling telemetry is disabled. Cloud commands are separate explicit operations.

Alchemy beta adapter uses private published paths because current exports are incomplete. The real upstream runtime is composed with Docker/containers denied; Worker/KV are actual upstream emulation. Queues, remote bindings, sidecar and a native Convex adapter are excluded. Future unsupported API releases and ambiguous translated dependency graphs fail clearly. API integration still needs maintenance.

The deterministic npm-to-pnpm translation preserves versions, integrity, dependency edges and metadata; it performs no second dependency resolution. A pnpm 12 import drifted a Prettier version during development and was rejected/removed. Bazel lifecycle hooks are disabled; verified lock hashes gate its wrapper.

Source archive, report and auth screenshot are ready for version-guarded replacements of their existing Library items. The current three-file batch stopped with "Library prepare_uploads is not available" before saving; no current Library replacement is confirmed. Updates are paused because the Library workflow forbids switching a started helper write to direct actions. Earlier source/report versions 3 and auth screenshot version 0 are the last confirmed Library versions. The original two vanilla screenshot Library items remain unchanged. Local updated deliverables and delivery-status.json are available. README.md includes working generation/install/sample commands, verification scripts and official references.
