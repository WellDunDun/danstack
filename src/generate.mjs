import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { upstreamTemplate } from './upstream.mjs';
import { bazelFiles } from './bazel.mjs';
import { buildTanstack } from './tanstack.mjs';
const templates = fileURLToPath(new URL('../templates/', import.meta.url));
const json = data => `${JSON.stringify(data, null, 2)}\n`;
async function overlay(dir, prefix = '') {
  const files = {};
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory()) Object.assign(files, await overlay(path.join(dir, item.name), `${prefix}${item.name}/`));
    else files[`${prefix}${item.name}`] = await readFile(path.join(dir, item.name), 'utf8');
  }
  return files;
}
export async function buildFiles(name, resolution, upstream = upstreamTemplate) {
  if (resolution.preset === 'tanstack-convex-workos') return buildTanstack(name, resolution);
  const scaffold = await upstream(resolution.packages['create-vite']);
  const files = {};
  for (const name of ['_gitignore', 'index.html', 'tsconfig.json']) files[name === '_gitignore' ? '.gitignore' : name] = scaffold[name];
  files['index.html'] = files['index.html'].replace(/<title>[^<]*<\/title>/, `<title>${name} · Fresh Stack</title>`).replace(/\s*<link[^>]*rel="icon"[^>]*>/, '');
  Object.assign(files, await overlay(path.join(templates, 'common')));
  if (!resolution.e2e) delete files['scripts/ui-test.mjs'];
  if (resolution.e2e) Object.assign(files, await overlay(path.join(templates, 'e2e')));
  const alchemy = resolution.preset === 'cloudflare-alchemy';
  Object.assign(files, await overlay(path.join(templates, alchemy ? 'alchemy' : resolution.preset === 'convex-confect' ? 'confect' : 'effect')));
  if (alchemy) { files['alchemy.run.ts'] = files['alchemy.run.ts'].replace('fresh-stack-cloud', `${name}-cloud`); files['infra/local.ts'] = files['infra/local.ts'].replace('fresh-stack-local', `${name}-local`); files['.gitignore'] += '\n.alchemy/\n.alchemy-local/\n'; files['src/main.ts'] = files['src-main.ts']; delete files['src-main.ts']; delete files['scripts/backend-codegen.mjs']; }
  files['.gitignore'] += '\n.env*\n!.env.example\n.e2e/\n.convex/\n';
  files['.env.example'] = alchemy ? '# Local Worker uses ephemeral synthetic state; cloud setup is explicit.\n' : '# Optional: after explicit backend setup, copy its URL here.\nVITE_CONVEX_URL=\n';
  if (!alchemy) files['convex.json'] = json({ functions: 'convex/' });
  // The full project checks authored backend, generated Confect sources, frontend and tests.
  const tsconfig = JSON.parse(scaffold['tsconfig.json'].replace(/\/\*[\s\S]*?\*\//g, ''));
  tsconfig.compilerOptions.types = ['vite/client', 'node'];
  tsconfig.include = alchemy ? ['src', 'infra', 'worker', 'tests', 'scripts/*.ts', 'alchemy.run.ts', 'e2e.config.ts'] : ['src', 'convex', 'confect', 'tests', 'e2e.config.ts'];
  files['tsconfig.json'] = json(tsconfig);
  const exact = group => Object.fromEntries(resolution.groups[group].map(p => [p, resolution.packages[p].version]));
  files['package.json'] = json({ name, private: true, version: '0.0.0', type: 'module', engines: { node: '>=24.8.0', npm: '>=11' }, scripts: {
    dev: 'vite --host 127.0.0.1', typecheck: 'tsc --noEmit', build: 'tsc --noEmit && vite build', preview: 'vite preview --host 127.0.0.1',
    test: 'node --import tsx --test tests/unit.test.ts',
    ...(resolution.preset === 'convex-confect' ? { 'codegen:local': 'confect codegen' } : {}),
    ...(alchemy ? { 'local:dev': 'node scripts/local.mjs dev', 'local:plan': 'node scripts/local.mjs plan', 'test:local': 'node scripts/local.mjs test', 'cloud:plan': 'alchemy plan alchemy.run.ts --stage cloud', 'cloud:deploy': 'alchemy deploy alchemy.run.ts --stage cloud' } : { 'backend:codegen': 'node scripts/backend-codegen.mjs', 'backend:setup': 'convex dev', 'backend:deploy': 'convex deploy' }),
    ...(resolution.e2e ? { 'test:ui': 'node scripts/ui-test.mjs' } : {}),
  }, dependencies: exact('dependencies'), devDependencies: exact('devDependencies') });
  files['fresh-stack.json'] = json(resolution);
  files['README.md'] = `# ${name}\n\nGenerated with ${resolution.preset}. Versions were resolved live and recorded in fresh-stack.json; npm installation creates package-lock.json.\n\n## Local commands\n\nFrom the parent directory, run \`node /path/to/fresh-stack/src/cli.mjs install ${name}\`. Then:\n\n\`\`\`sh\ncd ${name}\n${resolution.preset === 'convex-confect' ? 'npm run codegen:local\n' : ''}npm run typecheck\nnpm test\nnpm run build\nnpm run dev\n${resolution.e2e ? 'npm run test:ui\n' : ''}\`\`\`\n\nVite's vanilla TypeScript scaffold keeps this small: no React or frontend plugin peer chain. The UI runs the same Effect domain function locally until VITE_CONVEX_URL is configured. The local UI test does not prove a deployed backend. Unit tests invoke real registered Convex functions through convex-test (an in-process emulator, not a deployed backend).\n\n## Explicit backend operations\n\n\`npm run backend:setup\` runs the upstream Convex CLI and may prompt for authentication and provision a deployment. Run only when you intend that action. Copy the resulting Convex URL into .env.local as VITE_CONVEX_URL, then restart Vite. \`npm run backend:codegen\` needs an existing deployment. \`npm run backend:deploy\` deploys to cloud; the generator never runs it. No auth is configured in this public, stateless greeting demo. Add auth before introducing private data.\n\n${resolution.preset === 'convex-confect' ? 'Confect owns generated convex/schema.ts and convex/demo.ts. Edit confect/*.spec.ts and *.impl.ts, then run codegen:local. No handwritten _generated files are supplied.\n' : 'The stateless query uses the published queryGeneric builder without pretending codegen ran. After setup, use ./_generated/server for typed database access; commit real upstream-generated files.\n'}\n${resolution.e2e ? 'UI tests use tester-army/e2e without agent steps or model providers. Telemetry is disabled by the script. Its web engine may download Chromium on first run; no global install is required. Never add hosted engines or model steps without reviewing their costs and credentials.\n' : ''}\n## Maintenance\n\nUpstream scaffolding reduces glue but adapters still need review when APIs change. Newest compatible versions within reviewed adapters are selected; below-latest choices and peer/engine reasons are disclosed in fresh-stack.json and CLI output. Unsupported API releases fail before generation. Optional Bazel build/test targets use the recorded vendor toolchain and verified dependency graph. Alchemy is a separate explicit beta preset.\n`;
  if (alchemy) files['README.md'] = `# ${name}\n\nExplicit Alchemy v2 beta preset. Newest compatible live-resolved packages and any below-latest choices with reasons are in fresh-stack.json; the installed npm graph is in package-lock.json. Supporting Effect packages are exact roots so strict npm resolution preserves the selected peer-compatible set.\n\nAfter generator install: npm run typecheck; npm test; npm run build. The vanilla TypeScript Vite UI runs the shared Effect greeting locally. The separate Worker exposes GET /hello and GET/PUT /value backed by a KV binding.\n\nUse npm run local:plan, npm run test:local, or npm run local:dev. These register only local KV/Worker providers, use a fresh .alchemy-local session directory, fixed local stage, loopback, sanitized account settings, and disabled telemetry. No cloud state store, live provider, sidecar, remote binding, authentication or cloud provisioning is used. Local session data is intentionally ephemeral between commands; inspect .alchemy-local after a run and remove it when no process is using it.\n\nCloud operations are separate: npm run cloud:plan and npm run cloud:deploy use alchemy.run.ts and the project-specific cloud stack identity. They need your explicitly configured Cloudflare account. Plan may bootstrap infrastructure with other state stores: review any state/provider changes first. Never run generic alchemy dev against a stack containing unsupported local resources; it may deploy them. No Convex adapter is claimed.\n\nThe beta API adapter is reviewed for beta.81 within the v2 beta line; integration still needs maintenance. Current package exports require private published paths for Credentials, LocalRuntimeState and PathsLive. The real upstream runtime is composed with container capabilities denied to avoid its eager Docker proxy/image behavior. Worker and KV are real upstream emulations. Containers, queues, remote bindings and sidecar are outside this preset. Only the reviewed Alchemy ecosystem prereleases are allowed; other dependencies must be stable.\n`;
  if (resolution.bazel) {
    Object.assign(files, bazelFiles(resolution));
    Object.assign(files, await overlay(path.join(templates, 'bazel')));
    files['.gitignore'] += '\n.bazel-cache/\n.bazel-tools/\nbazel-*/\n';
    const pkg = JSON.parse(files['package.json']);
    Object.assign(pkg.scripts, { 'bazel:setup': 'node scripts/bazel.mjs setup', 'bazel:build': 'node scripts/bazel.mjs build //:bundle', 'bazel:test': 'node scripts/bazel.mjs test //:unit //:typecheck' });
    files['package.json'] = json(pkg);
    files['README.md'] += '\n## Bazel\n\nThe generator install translates the verified npm package-lock.json into pnpm-lock.yaml without re-resolution or lifecycle scripts; ambiguous duplicate dependency contexts fail clearly. Bazel downloads that locked graph through rules_js with lifecycle hooks disabled. Run npm run bazel:setup to acquire the recorded official Bazel binary and verify SHA256, then npm run bazel:build and npm run bazel:test. MODULE.bazel.lock is created on first Bazel resolution; commit it along with both package locks. Build emits bazel-bin/bundle; unit and typecheck tests declare their sources and dependencies. No infrastructure action is in a cacheable build/test target.\n';
  }
  return files;
}
export async function writeProject(target, files) {
  // Reserve exclusively. Never remove an existing destination or merge into it.
  await mkdir(target);
  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(target, name)), { recursive: true });
      await writeFile(path.join(target, name), content, { flag: 'wx' });
    }
  } catch (error) {
    error.message += ` Partial project left at ${target}; inspect and remove manually before retrying.`;
    throw error;
  }
}
