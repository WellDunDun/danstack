# Danstack

Daniel's barebones project scaffolder optimized for developer experience (DX) and agent experience (AX). Four reviewed presets: `convex-effect`, explicit `convex-confect`, explicit-beta `cloudflare-alchemy`, and `tanstack-convex-workos`. Optional deterministic e2e tests; real Bazel targets for the first three presets.

`danstack` is the repository/package name. The existing `fresh-stack` CLI command, generated receipt filenames and schema identifiers stay compatible; all `node src/cli.mjs` commands below continue to work. Generation resolves current compatible versions and records exact project versions. Authentication is optional generated-app setup.

Version numbers and integration results below document the October 10, 2026 verification run; they are provenance, not pinned template versions. This source repository retains the test fixtures, license notices and historical receipts. Generated smoke-test apps, dependency/cache/runtime directories and delivery helpers are excluded. Sample paths in historical receipts refer to the original workspace; generate fresh apps to run their checks. The original workspace remains intact.

The new TanStack Start + Convex + WorkOS AuthKit preset passed fresh strict installation, actual route codegen, typecheck/build, eight synthetic unit tests, a deterministic browser smoke and production SSR preview. Independent review reran all 47 CLI tests. Real OAuth, deployed JWT verification and live session expiry require accounts and remain unverified.

Fresh live Alchemy generation and strict installation passed, including real local Worker/KV and Bazel tests. The resolver selects the newest compatible releases within reviewed adapters and discloses every below-latest choice. Current Effect is 4.0.2, so platform-node, platform-node-shared, sql-d1 and sql-sqlite-do resolve to 4.0.2: their latest 4.0.3 releases require unavailable stable Effect ^4.0.3. The current proof uses live registry metadata and a new lockfile, without a historical snapshot.

## Commands

Node >=24.8 and npm >=11; no global installation.

```sh
npm ci --ignore-scripts
node src/cli.mjs presets
node src/cli.mjs create my-app --preset convex-effect --e2e --bazel --dry-run --json
node src/cli.mjs create my-app --preset convex-effect --e2e --bazel
node src/cli.mjs install my-app
cd my-app
npm run typecheck
npm test
npm run build
npm run dev
npm run bazel:setup
npm run bazel:build
npm run bazel:test
```

Generate from the intended parent directory. Only safe lowercase child slugs are accepted; existing destinations including empty directories, symlinks and unsafe names/paths are refused. No overwrite/force flag. Installation, credentials and deployment are separate operations.

For Confect use `--preset convex-confect`; after installation run `npm run codegen:local` before npm typecheck/test/build. Bazel performs real upstream Confect codegen in a declared output tree itself.

```sh
node src/cli.mjs create worker-demo --preset cloudflare-alchemy --alchemy-channel beta --bazel
node src/cli.mjs install worker-demo
cd worker-demo
npm run local:plan
npm run test:local
npm run local:dev
```

`--e2e` is optional for every preset. `npm run test:ui` uses tester-army/e2e's deterministic screen API with no agent steps or model providers and telemetry disabled. The engine may download Chromium on first use; use an absolute workspace `PLAYWRIGHT_BROWSERS_PATH` to keep the download local. The Convex presets test the labelled local Effect UI; the auth preset tests the real SSR setup-required UI. These do not prove a deployed backend.

## TanStack Start + Convex + WorkOS

Convex's official supported template command is:

```sh
npm create convex@latest my-app -- -t tanstack-start-authkit
```

Its current source is [get-convex/templates/template-tanstack-start-authkit](https://github.com/get-convex/templates/tree/main/template-tanstack-start-authkit). Current [WorkOS SDK guidance](https://workos.com/docs/sdks/authkit-tanstack-start) and [Convex AuthKit guidance](https://docs.convex.dev/auth/authkit/add-to-app) informed the adapter. The upstream initializer installs dependencies and its dry-run writes a destination, so this CLI reads current Git blobs as verified data, checks the supported structure, and generates locally reviewed executable/configuration files. It records the source commit/tree/blob hashes; it does not execute downloaded source or copy managed auth/deployment configuration. The tested commit is `59d5f70771deb5480aa73d133039d8b767827b63`.

```sh
node src/cli.mjs create auth-app --preset tanstack-convex-workos --tanstack-runtime rc --e2e --dry-run --json
node src/cli.mjs create auth-app --preset tanstack-convex-workos --tanstack-runtime rc --e2e
node src/cli.mjs install auth-app
cd auth-app
npm run typecheck
npm test
npm run build
npm run dev
# Open http://127.0.0.1:3000
```

The required `--tanstack-runtime rc` explicitly permits only `h3-v2` alias version `2.0.1-rc.20`, required by stable Start, and Babel's `gensync` `1.0.0-beta.2`. Missing selection or different prereleases fail clearly. Current exact roots include Start 1.168.61, Router 1.170.42, AuthKit 0.11.1, Convex 1.46.0, React 19.3.0, Vite 8.3.4 and TypeScript 7.0.2. WorkOS Node resolves to 10.14.0 because AuthKit requires ^10.7.0; latest 11.0.0 is incompatible and the reason is printed/recorded. Full versions and lockfiles are in the sample and verification receipt.

Without setup, sign-in stays disabled and protected routes fail closed. The generated README explains manual WorkOS/Convex configuration; local dev starts Vite only. Keep the browser and WorkOS redirect on exactly `http://127.0.0.1:3000`, with callback `/api/auth/callback`; the server refuses port drift and handlers reject a mismatched origin. Secrets stay server-only. SSR clients are request-scoped, tokens are excluded from serialized route context, CSRF middleware precedes AuthKit, and the private Convex query independently checks identity. AuthKit owns PKCE, cookies and session APIs; the app also rechecks sessions on focus and each visible minute because SDK 0.11.1's ordinary expiry path does not always call its expiry callback.

This preset uses React because the official supported TanStack Start/AuthKit integration requires it. It supports optional deterministic e2e; `--bazel` is rejected and Effect/Confect integration is outside this preset. The earlier presets retain their integrations. API changes still need adapter review. Current tooling emits upstream router circular-dependency and tsconfig-path plugin deprecation warnings; checks pass, but these are maintenance signals.

## shadcn/ui included in the React preset

`tanstack-convex-workos` now includes current shadcn `base-nova` Button, Card and Input by default, Tailwind 4/Vite integration, complete CSS theme/imports, Base UI primitives, `cn`, CVA, lucide and animation styles. The app actually uses those components, with labelled local input validation and keyboard focus states. Its copy says **Generated app preview** and **Scaffolding is complete**; service configuration is optional until you want to test sign-in. Vanilla TypeScript presets remain vanilla and do not claim React component support.

```sh
# Inside the installed React app; preview a future component addition:
npm run ui:add -- badge --dry-run
# Apply deliberately, without --overwrite:
npm run ui:add -- badge
```

This uses the recorded local upstream shadcn CLI. Additions can modify source/package/lock files and install dependencies; review the diff. No upstream init/add runs during scaffolder create/install. After adding new dependency roots, use normal reviewed npm operations: the strict scaffolder installer intentionally refuses changed root manifests. `components.json` uses `base-nova`, `rsc: false`, `src/app.css` and aliases aligned with TypeScript/Vite; the utility re-exports current `cn`.

Generation fetches current official component registry data, checks its exact audited executable hashes and rejects new files, targets, dependency surfaces or config/environment mutations. New registry/API changes require review. Current packages: shadcn 4.21.4, Tailwind/plugin 4.3.3, Base UI 1.9.0, cn 0.2.6, CVA 0.7.1, lucide-react 1.55.0 and tw-animate-css 1.4.0. Latest cn 0.4.0 violates shadcn’s ^0.2.4 dependency; the compatible selection and reason are disclosed. Followed current [shadcn TanStack docs](https://ui.shadcn.com/docs/installation/tanstack), [manual setup](https://ui.shadcn.com/docs/installation/manual) and [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).

Tailwind’s optional WASM archive includes six bundled packages without individual archive hashes. The installer verifies the enclosing official archive SHA512, parses data-only manifests with size/path/link limits, checks the declared package set and all dependency/peer/engine metadata and edges against the lock, then runs npm ci with scripts disabled. Only the reviewed Tailwind 4.3.3 parent is supported; future bundles fail clearly for review. This check also runs on existing-lock install plans and is non-mutating. Bazel refuses bundled graphs.

## Fresh versions, coherent resolution

Every generation fetches full release metadata from the official npm registry. Ordinary package candidates are stable releases sorted by version, regardless of misleading dist-tags. The resolver searches for a coherent set in the recorded `selectionOrder`: newest domain/backend dependencies first, then supporting dependencies, then development tools. This defines a deterministic lexicographic priority when two packages cannot both use their newest release. A bounded search fails explicitly if exhausted; it never returns an approximate set.

The resolver validates Node/npm engines, required and present optional peers, and dependency edges between reviewed packages. Lower compatible versions are permitted within supported adapters, with the selected version, latest eligible version, dist-tag latest and peer/dependency/engine reasons printed by the CLI and recorded in `fresh-stack.json`. Malformed metadata, missing required peers outside the preset, no compatible combination and latest APIs outside reviewed adapter bounds fail before writes. An unsupported major is never hidden by choosing an older major.

The Alchemy preset requires explicit `--alchemy-channel beta`; the reviewed adapter accepts beta.81 and rejects newer unreviewed betas. Only its narrow, version-specific ecosystem prerelease chain is allowed. Its Effect support packages are exact direct roots because their peers also constrain the coherent graph; this adds no SQL feature to the demo. Production never reads historical snapshots, and no implicit prereleases, forced peer resolution or incompatible latest major mixing is used. Integration still requires maintenance: upstream scaffolding cannot eliminate API adapters.

`fresh-stack.json` records exact versions, peers, engines, archive integrity, runtime and policy. `package.json` contains exact direct versions. Generation is separate from install. Installation resolves an npm v3 lock with strict peer/engine checks and lifecycle scripts disabled, verifies root archives against generation metadata and the full graph's source/prerelease policy, runs `npm ci`, then `npm ls --all`. Transitive versions follow upstream compatible ranges and are recorded in `package-lock.json`. Repeat installs reuse that lock. Empty temporary npm user/global configs and stripped inherited npm settings isolate install configuration; linked metadata, altered package groups, local npmrc and shrinkwrap are refused.

Create `--dry-run` performs live resolution and scaffold shape verification entirely in memory; it writes no destination/cache. Install `--dry-run` validates existing manifest/lock and prints the command; it does not resolve a new transitive graph. Offline/HTTP failures are explicit.

## App adapters

The lightweight frontend uses the released `create-vite` vanilla TypeScript archive as data: integrity checked, paths allowlisted, initializer never executed. Vanilla TypeScript avoids a frontend framework/plugin peer chain. The shared Effect domain powers the accessible greeting UI.

`convex-effect` exposes a public stateless query through the real `queryGeneric` builder with argument/return validators. No counterfeit `_generated` files. Configure `VITE_CONVEX_URL` after deliberate setup to invoke the real backend. Backend unit tests call actual registered queries through `convex-test`'s in-process emulator. This does not prove a deployed backend. After setup use upstream-generated `./_generated/server` for schema-typed database access.

`convex-confect` uses current 10.2 lazy Schema specs and finalized implementation layers. Real `confect codegen` owns `convex/schema.ts`, `convex/demo.ts` and `confect/_generated`; edit the authored specs/implementations. Confect's CLI is not represented as a full app initializer.

`cloudflare-alchemy` uses real current v2 Worker/KV resources, binding and Effect handler. Its API has GET `/hello` and PUT/GET `/value`; local integration tests write and retrieve a synthetic value through actual workerd KV emulation. The local wrapper registers only local Worker/KV providers, fixed local stage, a fresh ephemeral `.alchemy-local` session, loopback on an allocated port, isolated Alchemy/XDG directories, sanitized cloud settings, denied credentials/remote bindings and disabled telemetry. No state cloud bootstrap or sidecar. Each local command starts fresh; do not expect cross-session persistence.

Alchemy beta.81's published exports require private published paths for Credentials, LocalRuntimeState and PathsLive. Its default runtime eagerly starts a Docker proxy/image workflow, so this small adapter composes the real upstream runtime with container capabilities denied. Worker/KV emulation remains upstream. Containers, queues, remote bindings and a native Convex adapter are outside this preset. The reviewed workerd compatibility date is 2026-09-18, within the shipped runtime's supported range. These are explicit maintenance costs, not a claim of maintenance-free beta integration.

## Optional Bazel

`--bazel` resolves current stable Bazel from its official GitHub release, current unyanked stable rules_js/rules_nodejs from BCR, and current stable Node from its official release index. It validates module Bazel compatibility, npm package Node engines and reviewed adapter bounds. `fresh-stack.json` records vendor URLs/checksums, module source integrity and exact tool versions; `.bazelversion`, `.nvmrc` and `MODULE.bazel` pin them. Node archive SHA256 values are explicit toolchain inputs.

`npm run bazel:setup` downloads only the recorded official vendor executable, verifies SHA256 and stores it in this project. It performs no global install. The wrapper disables system/home Bazel rc files and refuses edited/unverified dependency locks. Workspace `.bazelrc` remains reviewable project configuration.

rules_js consumes pnpm v9 lock format. Generator install deterministically translates the verified npm v3 graph into `pnpm-lock.yaml`, preserving exact archives and dependency edges without re-resolution, pnpm execution or lifecycle hooks. Duplicate versions with differing resolution contexts, archive identities or metadata fail rather than flatten incorrectly. A real pnpm 12 import changed a locked Prettier version during development and was rejected; it is not used. Both locks and their hashes are recorded. Bazel downloads that exact graph with lifecycle hooks disabled. `MODULE.bazel.lock` is produced by first Bazel resolution and is included in verified samples; commit all three locks.

Targets are actual declared, cacheable actions: `//:bundle` emits Vite's frontend bundle (`bazel-bin/bundle`), and Alchemy additionally emits a Worker ES bundle under `bundle/worker`; `//:unit` runs real unit tests; `//:typecheck` checks TypeScript; Confect additionally has real upstream `//:codegen` as a dependency. Alchemy frontend/Worker and unit actions declare only their imported Effect/Vite/tsx package graphs, while typecheck receives the complete SDK graph. Source changes invalidate outputs; unchanged builds reuse actions. Auth, local infrastructure emulation, plan and deployment are deliberately outside these pure targets. A first Alchemy Bazel attempt exhausted the disk by duplicating unnecessary SDK inputs; narrower action dependencies and deleting the separate npm install before Bazel verification address that footprint. Bazel still adds meaningful download/disk overhead for a small app; use it when repeatable build graphs/caching justify that cost.

## Explicit cloud operations

Convex: `backend:codegen` requires an existing deployment and stops with `BACKEND_PREREQUISITE` (exit 2) before upstream execution if absent. `backend:setup` invokes upstream `convex dev` and may authenticate/provision. `backend:deploy` deploys. The original Effect greeting is public; the TanStack preset has explicit WorkOS auth configuration and a protected query. The latter requires `WORKOS_CLIENT_ID` on the Convex deployment before a successful push.

Alchemy: `cloud:plan` and `cloud:deploy` use the project-specific cloud stack and need an explicitly configured Cloudflare account. Other state stores can cause plan to bootstrap infrastructure; review provider/state changes. Generic `alchemy dev` can deploy resources unsupported by local emulation. None of these cloud commands is called by generation, install or verification. No deployments, real data, credentials changes, model calls, pushes or package publication occurred.

## Verification and deliverables

```sh
npm test
npm run check
node scripts/verify-samples.mjs --with-ui
# Fresh infra matrix, sequential with dependency/cache cleanup for disk space:
node scripts/verify-infra.mjs
# Fresh live Alchemy+Bazel+e2e compatibility proof in its own empty destination:
node scripts/verify-compatible.mjs
# Fresh TanStack/AuthKit sample, built SDK failure-flow probes and inspected UI:
node scripts/verify-tanstack.mjs
python3 scripts/archive.py
```

Verification scripts refuse to overwrite their named sample destinations. Use a clean workspace, or move your prior synthetic samples before generating again. `receipts/compatible-verification.json` is the current live Alchemy proof: dry-run with no destination, fresh generation/install, full typecheck, unit/build/tree checks, real local plan/Worker/KV and Bazel bundle/tests/cache reuse. It has no snapshot replay and began without a lockfile. Only the affected Alchemy preset was rerun after the solver change.

`receipts/tanstack-verification.json` records 22 passing checks for the new auth preset, including expected refusal/prerequisite exits. Repeat install preserves the lock. Actual SDK handlers create a PKCE cookie locally, reject alternate origins/cross-site RPCs, and safely handle missing callback codes; a global fetch guard records zero outbound attempts. No hosted sign-in was followed. Convex tests use synthetic identities in the actual emulator; they do not verify JWT signatures. The inspected setup screenshot is `receipts/tanstack-auth-setup-required.png`. Real OAuth exchange, JWT issuer verification, deployed backend codegen and live expiry remain prerequisites, not passed tests.

The earlier eight-sample infrastructure matrix is retained as historical evidence. Four Convex/Confect variants were generated live; four Alchemy variants explicitly used a historical coherent snapshot under the earlier latest-only resolver. The test-only replay/seed scripts and fixtures are never production inputs. Those old Alchemy manifests predate the newly reviewed supporting package roots; reproduce them with their own locked `npm ci --ignore-scripts`, rather than the current generator installer. Earlier latest-only rejection receipts and an initial strict transitive-peer failure are preserved as development history, superseded by the current passing live proof. No --force or legacy-peer-deps is used. The original Convex samples retain actual deterministic browser reports and inspected screenshots. New infrastructure variants configure/typecheck e2e without claiming new browser runs. Browser/model tests are never part of Bazel targets.

The source archive contains authored generator/templates/tests/scripts, required offline fixtures, license notices and nonsecret historical test receipts. It excludes generated samples, dependency/vendor/cache binaries, local runtime state, real env files, credentials and delivery helpers (the empty `.env.example` template is retained). Historical `research/create-vite-9.2.1.tgz` is only an offline test fixture, never production resolution input. Sample verification scripts expect a `samples` directory: create it first with `mkdir -p samples`. `verify:samples` additionally expects freshly generated and installed `effect-demo` and `confect-demo` apps with `--e2e`; Confect needs `npm run codegen:local`. `verify-compatible.mjs` and `verify-tanstack.mjs` generate their own apps in that directory and refuse an existing destination.

See `receipts/VERIFICATION.md`, `receipts/tanstack-verification.json`, `receipts/compatible-verification.json`, `receipts/verification.json` and `receipts/infra-*.json` for results and limitations. Missing deployed Convex prerequisites are recorded as blocked, never passed cloud codegen. Independent review covers compatible resolution, install safety, graph translation, generated actions, auth/SSR boundaries and local/cloud separation.

Official references: [Convex scaffolder](https://github.com/get-convex/templates/blob/main/create-convex/README.md), [Confect](https://github.com/rjdellecese/confect), [Effect](https://effect.website/), [tester-army/e2e](https://github.com/tester-army/e2e), [Alchemy CLI](https://alchemy.run/cli/), [Bazel](https://bazel.build/), [rules_js](https://github.com/aspect-build/rules_js), [rules_nodejs](https://github.com/bazel-contrib/rules_nodejs). Release-specific source/types and metadata were inspected from official registries/vendors.

## License and distribution

Danstack’s authored source is licensed under the [MIT License](LICENSE). See [third-party notices](THIRD-PARTY-NOTICES.md) for retained upstream licenses.

The repository is distributed as source. npm publishing remains disabled through `"private": true`; the CLI has not been published as an npm package. Use the source-checkout commands above.
