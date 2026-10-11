import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, rm, symlink, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '../src/cli.mjs';
import { resolve, registryReader } from '../src/resolve.mjs';
import { destination } from '../src/paths.mjs';
import { buildFiles, writeProject } from '../src/generate.mjs';
import { installPlan, verifyLock } from '../src/install.mjs';
import { fixture, read, add, config, scaffold } from './fixtures.mjs';
const temp = async t => { const dir = await mkdtemp(path.join(os.tmpdir(), 'fresh-stack-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; };
const fails = (p, code) => assert.rejects(p, e => e.code === code);

test('strict CLI argument handling and help', () => {
  assert.equal(parse(['create', 'demo', '--e2e', '--dry-run']).dryRun, true);
  assert.equal(parse(['install', '--help']).help, true);
  for (const args of [['oops'], ['create'], ['create', 'a', 'b'], ['create', 'a', '--preset'], ['create', 'a', '--wat'], ['install', 'a', '--e2e'], ['presets', 'a'], ['create', 'a', '--json', '--json']]) assert.throws(() => parse(args), e => e.code === 'ARGUMENT');
  const run = spawnSync(process.execPath, ['src/cli.mjs', 'create', '../unsafe'], { encoding: 'utf8' });
  assert.equal(run.status, 1); assert.equal(JSON.parse(run.stderr).error, 'PATH');
});
test('highest stable release wins regardless of tag order; no prerelease', async () => {
  const data = fixture(); add(data, 'effect', '4.0.3'); add(data, 'effect', '5.0.0-beta.1');
  data.effect['dist-tags'] = { latest: '5.0.0-beta.1' };
  const result = await resolve({ ...config, read: read(data) });
  assert.equal(result.packages.effect.version, '4.0.3');
});
test('future unsupported major fails without downgrade', async () => {
  const data = fixture(); add(data, 'effect', '5.0.0');
  await fails(resolve({ ...config, read: read(data) }), 'ADAPTER');
});
test('Confect peer mismatch fails with useful evidence', async () => {
  const data = fixture(); data['@confect/server'].versions['10.2.0'].peerDependencies.effect = '^3';
  await assert.rejects(resolve({ ...config, preset: 'convex-confect', read: read(data) }), e => e.code === 'PEER' && e.details.peer === 'effect' && e.message.includes('No supported compatible'));
});
test('engine node and npm constraints are enforced', async () => {
  await fails(resolve({ ...config, node: '22.0.0', read: read(fixture()) }), 'ENGINE');
  const data = fixture(); data.convex.versions['1.46.0'].engines.npm = '>=12';
  await fails(resolve({ ...config, read: read(data) }), 'ENGINE');
});
test('optional absent peers are omitted; unknown required peers fail', async () => {
  const result = await resolve({ ...config, preset: 'convex-confect', read: read(fixture()) });
  assert.equal(result.packages['@effect/platform-node'], undefined);
  const data = fixture(); data.effect.versions['4.0.2'].peerDependencies = { mystery: '^1' };
  await fails(resolve({ ...config, read: read(data) }), 'ADAPTER');
});
test('unknown preset, missing stable and malformed metadata fail', async () => {
  await fails(resolve({ ...config, preset: 'alchemy', read: read(fixture()) }), 'ARGUMENT');
  const data = fixture(); data.effect.versions = {}; add(data, 'effect', '5.0.0-beta.1');
  await fails(resolve({ ...config, read: read(data) }), 'RELEASE');
  const invalid = fixture(); delete invalid.convex.versions['1.46.0'].dist.integrity;
  await fails(resolve({ ...config, read: read(invalid) }), 'REGISTRY');
});
test('offline, HTTP and corrupt registry errors have no fallback', async () => {
  for (const fetcher of [async () => { throw new Error('offline'); }, async () => ({ ok: false, status: 503 }), async () => ({ ok: true, json() { throw new Error('bad'); } })])
    await fails(resolve({ ...config, read: registryReader({ fetcher }) }), 'REGISTRY');
});
test('unsafe names and destinations are refused without writes', async t => {
  const dir = await temp(t);
  for (const name of ['../x', '/tmp/x', '.', '..', '-oops', 'a/b', 'MyApp', 'nul', 'node_modules', 'a'.repeat(65), 'a--b']) await fails(destination(name, dir), 'PATH');
  await mkdir(path.join(dir, 'occupied')); await writeFile(path.join(dir, 'occupied', 'keep'), 'unchanged');
  await fails(destination('occupied', dir), 'EXISTS');
  assert.equal(await readFile(path.join(dir, 'occupied', 'keep'), 'utf8'), 'unchanged');
  await symlink(path.join(dir, 'occupied'), path.join(dir, 'linked')); await fails(destination('linked', dir), 'PATH');
  await mkdir(path.join(dir, 'empty')); await fails(destination('empty', dir), 'EXISTS');
});
test('plan is non-mutating, both presets emit exact versions and install is explicit', async t => {
  const dir = await temp(t);
  for (const preset of ['convex-effect', 'convex-confect']) {
    const target = await destination(preset, dir);
    const resolution = await resolve({ ...config, preset, read: read(fixture()) });
    const files = await buildFiles(preset, resolution, scaffold);
    assert.deepEqual(await readdir(dir), []);
    const manifest = JSON.parse(files['package.json']);
    assert.equal(manifest.dependencies.effect, '4.0.2');
    assert.equal(files['package-lock.json'], undefined);
    assert.equal(files['convex/_generated/server.ts'], undefined);
    assert.equal(files['confect/_generated/schema.ts'], undefined);
    await writeProject(target, files);
    const plan = await installPlan(target, { node: config.node, npm: config.npm });
    assert.ok(plan.args.includes('--ignore-scripts')); assert.equal(plan.args[0], 'install');
    await fails(writeProject(target, files), 'EEXIST');
    await rm(target, { recursive: true });
  }
});
test('install refuses manifest changes, npmrc and symlinked metadata', async t => {
  const dir = await temp(t); const target = path.join(dir, 'app');
  const files = await buildFiles('app', await resolve({ ...config, read: read(fixture()) }), scaffold);
  await writeProject(target, files);
  await writeFile(path.join(target, '.npmrc'), 'registry=bad');
  await fails(installPlan(target, config), 'MANIFEST'); await rm(path.join(target, '.npmrc'));
  const manifest = JSON.parse(files['package.json']); manifest.dependencies.effect = '3.0.0';
  await writeFile(path.join(target, 'package.json'), JSON.stringify(manifest));
  await fails(installPlan(target, config), 'MANIFEST');
  await rm(path.join(target, 'fresh-stack.json')); await symlink(path.join(target, 'package.json'), path.join(target, 'fresh-stack.json'));
  await fails(installPlan(target, config), 'PATH');
});
test('lockfile must match root and resolved versions; disallows arbitrary sources', () => {
  const manifest = { dependencies: { effect: '4.0.2' }, devDependencies: {} };
  const lock = { lockfileVersion: 3, packages: { '': manifest, 'node_modules/effect': { version: '4.0.2', integrity: 'sha512-fixture', resolved: 'https://registry.npmjs.org/effect/-/effect-4.0.2.tgz' } } };
  verifyLock(lock, manifest);
  lock.packages['node_modules/effect'].version = '4.0.1'; assert.throws(() => verifyLock(lock, manifest), e => e.code === 'LOCK');
  lock.packages['node_modules/effect'].version = '4.0.2'; lock.packages['node_modules/effect'].resolved = 'https://evil.test/a.tgz'; assert.throws(() => verifyLock(lock, manifest), e => e.code === 'LOCK');
});
test('new required peers outside a preset fail before generation', async () => {
  const data = fixture(); data.effect.versions['4.0.2'].peerDependencies = { '@confect/core': '^10.2' };
  await fails(resolve({ ...config, read: read(data) }), 'ADAPTER');
});
test('install rejects receipt links, node_modules links and extra npm fields before npm runs', async t => {
  const dir = await temp(t); const target = path.join(dir, 'app');
  const files = await buildFiles('app', await resolve({ ...config, read: read(fixture()) }), scaffold);
  await writeProject(target, files);
  const victim = path.join(dir, 'victim'); await writeFile(victim, 'keep');
  await symlink(victim, path.join(target, 'fresh-stack-install.json'));
  await fails(installPlan(target, config), 'PATH');
  assert.equal(await readFile(victim, 'utf8'), 'keep'); await rm(path.join(target, 'fresh-stack-install.json'));
  await symlink(dir, path.join(target, 'node_modules')); await fails(installPlan(target, config), 'PATH'); await rm(path.join(target, 'node_modules'));
  for (const key of ['optionalDependencies', 'overrides', 'workspaces', 'bundledDependencies']) {
    const manifest = JSON.parse(files['package.json']); manifest[key] = key === 'workspaces' ? ['../victim'] : { evil: 'https://bad.test/e.tgz' };
    await writeFile(path.join(target, 'package.json'), JSON.stringify(manifest));
    await fails(installPlan(target, config), 'MANIFEST');
  }
});
test('CLI runtime floor is checked even without e2e', async () => {
  await fails(resolve({ ...config, node: '20.19.0', e2e: false, read: read(fixture()) }), 'ENGINE');
  await fails(resolve({ ...config, npm: '10.0.0', e2e: false, read: read(fixture()) }), 'ENGINE');
});
test('complete CLI dry-run uses live-shaped metadata and real archive without target or cache writes', async t => {
  const dir = await temp(t);
  const cli = new URL('../src/cli.mjs', import.meta.url).href;
  const fixtures = new URL('./fixtures.mjs', import.meta.url).href;
  const archive = new URL('../research/create-vite-9.2.1.tgz', import.meta.url).pathname;
  const program = `
    import { readFile } from 'node:fs/promises';
    import { createHash } from 'node:crypto';
    import { fixture } from ${JSON.stringify(fixtures)};
    const bytes = await readFile(${JSON.stringify(archive)});
    const data = fixture();
    data['create-vite'].versions['9.2.1'].dist.integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
    globalThis.fetch = async url => String(url).endsWith('.tgz') ? { ok: true, arrayBuffer: async () => bytes } : { ok: true, json: async () => data[decodeURIComponent(new URL(url).pathname.slice(1))] };
    const { main } = await import(${JSON.stringify(cli)});
    await main(['create', 'dry-demo', '--e2e', '--dry-run', '--json']);
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', program], { cwd: dir, env: { ...process.env, npm_config_cache: path.join(dir, 'npm-cache') }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).action, 'plan');
  assert.deepEqual(await readdir(dir), []);
});
test('non-e2e starter omits browser packages and scripts', async () => {
  const resolution = await resolve({ ...config, e2e: false, read: read(fixture()) });
  const files = await buildFiles('app', resolution, scaffold);
  assert.equal(resolution.packages.e2e, undefined);
  assert.equal(files['e2e.config.ts'], undefined);
  assert.equal(files['scripts/ui-test.mjs'], undefined);
});
test('subprocess environment strips inherited npm overrides and forces local mode', async t => {
  const dir = await temp(t);
  const { run } = await import('../src/install.mjs');
  const previous = { prefix: process.env.npm_config_prefix, global: process.env.NPM_CONFIG_GLOBAL, scoped: process.env['npm_config_@evil:registry'] };
  process.env.npm_config_prefix = '/tmp/unintended'; process.env.NPM_CONFIG_GLOBAL = 'true'; process.env['npm_config_@evil:registry'] = 'https://evil.test';
  try {
    const output = await run(process.execPath, ['--input-type=module', '--eval', "console.log(JSON.stringify(Object.fromEntries(Object.entries(process.env).filter(([k]) => /^npm_config_/i.test(k)))))"], dir, true);
    const env = JSON.parse(output);
    assert.equal(env.npm_config_global, 'false'); assert.equal(env.npm_config_prefix, undefined); assert.equal(env.NPM_CONFIG_GLOBAL, undefined); assert.equal(env['npm_config_@evil:registry'], undefined);
  } finally {
    for (const [key, value] of [['npm_config_prefix', previous.prefix], ['NPM_CONFIG_GLOBAL', previous.global], ['npm_config_@evil:registry', previous.scoped]]) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});
test('lock graph rejects prereleases in transitive dependencies', () => {
  const manifest = { dependencies: {}, devDependencies: {} };
  const lock = { lockfileVersion: 3, packages: { '': manifest, 'node_modules/transitive': { version: '2.0.0-beta.1', integrity: 'sha512-fixture', resolved: 'https://registry.npmjs.org/transitive/-/transitive.tgz' } } };
  assert.throws(() => verifyLock(lock, manifest), e => e.code === 'LOCK' && e.message.includes('Prerelease'));
});
