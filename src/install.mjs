import { spawn } from 'node:child_process';
import { readFile, lstat, writeFile, rename, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { npmToBazelLock } from './npm-bazel-lock.mjs';
import semver from 'semver';
import { verifyBundles } from './bundles.mjs';
import { Diagnostic, REGISTRY, adapters, requirements, alchemyPrereleases, tanstackPrereleases } from './resolve.mjs';
async function safeRead(target, name) {
  const location = path.join(target, name);
  const info = await lstat(location);
  if (!info.isFile() || info.isSymbolicLink()) throw new Diagnostic('PATH', `Expected a real file: ${location}`);
  return JSON.parse(await readFile(location, 'utf8'));
}
export async function installPlan(target, runtime) {
  const resolution = await safeRead(target, 'fresh-stack.json');
  const manifest = await safeRead(target, 'package.json');
  if (resolution.schemaVersion !== 1 || resolution.generator !== 'fresh-stack@0.1.0' || resolution.registry !== REGISTRY)
    throw new Diagnostic('MANIFEST', 'Unrecognized resolution receipt. Regenerate with this CLI.');
  const allowed = new Set(['name', 'private', 'version', 'type', 'engines', 'scripts', 'dependencies', 'devDependencies']);
  if (Object.keys(manifest).some(k => !allowed.has(k)) || manifest.private !== true || manifest.type !== 'module')
    throw new Diagnostic('MANIFEST', 'Unsupported package.json fields or project type; review and install manually.');
  if (resolution.preset === 'cloudflare-alchemy' && resolution.alchemyChannel !== 'beta') throw new Diagnostic('CHANNEL', 'Missing explicit Alchemy beta selection in receipt.');
  if (resolution.preset === 'tanstack-convex-workos' && resolution.tanstackRuntime !== 'rc') throw new Diagnostic('CHANNEL', 'Missing explicit TanStack RC runtime selection in receipt.');
  const expected = requirements(resolution.preset, resolution.e2e, resolution.bazel);
  for (const group of ['dependencies', 'devDependencies']) {
    const actual = manifest[group] ?? {};
    if (Object.keys(actual).sort().join() !== expected[group].sort().join())
      throw new Diagnostic('MANIFEST', `Manifest ${group} changed; install manually after review or regenerate.`);
    for (const [name, version] of Object.entries(actual)) {
      const meta = resolution.packages[name];
      if (!semver.valid(version) || !meta || version !== meta.version || !semver.satisfies(version, adapters[name] ?? '<0', { includePrerelease: ['alchemy', '@alchemy.run/cloudflare-runtime'].includes(name) }))
        throw new Diagnostic('MANIFEST', `Unrecognized resolved version for ${name}.`);
      for (const [engine, current] of Object.entries(runtime)) {
        if (meta.engines[engine] && !semver.satisfies(current, meta.engines[engine]))
          throw new Diagnostic('ENGINE', `${name}@${version} requires ${engine} ${meta.engines[engine]}; current ${current}.`);
      }
    }
  }
  try {
    const info = await lstat(path.join(target, 'node_modules'));
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Diagnostic('PATH', 'Refusing a linked or non-directory node_modules.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try {
    const receipt = await safeRead(target, 'fresh-stack-install.json');
    if (receipt.generator !== 'fresh-stack@0.1.0') throw new Diagnostic('MANIFEST', 'Refusing an unrecognized existing installation receipt.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const name of ['.npmrc', 'npm-shrinkwrap.json']) {
    try { await lstat(path.join(target, name)); throw new Diagnostic('MANIFEST', `Refusing ${name} in generated destination; review it and install manually.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  let locked = false;
  try {
    const lock = await safeRead(target, 'package-lock.json');
    verifyLock(lock, manifest, resolution, await verifyBundles(lock, resolution));
    locked = true;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (resolution.bazel) {
    try {
      const location = path.join(target, 'pnpm-lock.yaml');
      const info = await lstat(location);
      if (!info.isFile() || info.isSymbolicLink()) throw new Diagnostic('PATH', 'Refusing linked pnpm lockfile.');
      const previous = await safeRead(target, 'fresh-stack-install.json').catch(error => { throw new Diagnostic('LOCK', `Cannot verify existing pnpm lock ownership: ${error.message}`); });
      const source = await readFile(location, 'utf8');
      if (previous.lockHashes?.['pnpm-lock.yaml'] !== createHash('sha256').update(source).digest('hex')) throw new Diagnostic('LOCK', 'Changed or unowned pnpm lockfile; inspect manually.');
      verifyPnpm(source, await safeRead(target, 'package-lock.json').catch(error => { throw new Diagnostic('LOCK', `Missing npm graph for existing pnpm lock: ${error.message}`); }), manifest);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { target, manifest, resolution, command: 'npm', args: [locked ? 'ci' : 'install', '--ignore-scripts', '--strict-peer-deps', '--engine-strict', '--no-audit', '--no-fund', `--registry=${REGISTRY}`, '--global=false', `--prefix=${target}`, ...[...new Set(Object.keys(resolution.packages).filter(n => n.startsWith('@')).map(n => n.split('/')[0]))].map(scope => `--${scope}:registry=${REGISTRY}`), '--fetch-retries=0', '--fetch-timeout=15000'] };
}
export function verifyLock(lock, manifest, resolution = {}, bundles = {}) {
  if (lock.lockfileVersion !== 3 || !lock.packages?.['']) throw new Diagnostic('LOCK', 'Expected an npm v3 lockfile.');
  for (const group of ['dependencies', 'devDependencies']) {
    if (JSON.stringify(Object.entries(lock.packages[''][group] ?? {}).sort()) !== JSON.stringify(Object.entries(manifest[group] ?? {}).sort()))
      throw new Diagnostic('LOCK', `Lockfile root ${group} differs from package.json.`);
    for (const [name, version] of Object.entries(manifest[group] ?? {})) {
      if (lock.packages[`node_modules/${name}`]?.version !== version)
        throw new Diagnostic('LOCK', `Lockfile version for ${name} differs from the resolved version.`);
      const expected = resolution.packages?.[name];
      if (expected && (lock.packages[`node_modules/${name}`].integrity !== expected.integrity || lock.packages[`node_modules/${name}`].resolved !== expected.tarball))
        throw new Diagnostic('LOCK', `Lockfile archive for ${name} differs from generation metadata.`);
    }
  }
  for (const [name, meta] of Object.entries(lock.packages)) {
    if (!name) continue;
    const pkg = name.slice(name.lastIndexOf('node_modules/') + 13);
    const allow = (resolution.preset === 'cloudflare-alchemy' && resolution.alchemyChannel === 'beta' && semver.satisfies(meta.version, alchemyPrereleases[pkg] ?? '<0', { includePrerelease: true })) || (resolution.preset === 'tanstack-convex-workos' && resolution.tanstackRuntime === 'rc' && meta.version === tanstackPrereleases[pkg]);
    if (!semver.valid(meta.version) || (semver.prerelease(meta.version) && !allow))
      throw new Diagnostic('LOCK', `Prerelease or invalid version in dependency graph: ${name}@${meta.version}. No prereleases are permitted.`);
    const proof = bundles[name];
    if (meta.inBundle && proof?.version === meta.version && proof?.integrity === lock.packages[proof.parent]?.integrity && !meta.link && !meta.resolved && !meta.integrity) continue;
    if (meta.inBundle || meta.link || !meta.integrity || typeof meta.resolved !== 'string' || new URL(meta.resolved).origin !== REGISTRY)
      throw new Diagnostic('LOCK', `Unexpected source for ${name}; only integrity-bearing official registry archives are allowed.`);
  }
}
export function run(command, args, cwd, capture = false, npmConfigs = []) {
  return new Promise((ok, fail) => {
    const child = spawn(command, [...args, ...npmConfigs], { cwd, shell: false, stdio: ['ignore', 'pipe', 'pipe'], env: { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^npm_config_/i.test(key))), npm_config_global: 'false', npm_config_ignore_scripts: 'true', npm_config_engine_strict: 'true', npm_config_strict_peer_deps: 'true', npm_config_registry: REGISTRY, E2E_TELEMETRY_DISABLED: '1' } });
    let out = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', c => { if (capture) out += c; else process.stderr.write(c); });
    child.on('error', fail);
    child.on('exit', code => code === 0 ? ok(out) : fail(new Diagnostic('INSTALL', `${command} ${args[0]} exited ${code}. No scripts, auth or deployment were run; inspect the destination before retrying.`, { output: out.slice(-4000) })));
  });
}
export async function install(plan) {
  const configDir = await mkdtemp(path.join(os.tmpdir(), 'fresh-stack-npm-'));
  const userconfig = path.join(configDir, 'user.npmrc');
  const globalconfig = path.join(configDir, 'global.npmrc');
  try {
  await writeFile(userconfig, '', { flag: 'wx' });
  await writeFile(globalconfig, '', { flag: 'wx' });
  const npmConfigs = [`--userconfig=${userconfig}`, `--globalconfig=${globalconfig}`];
  if (plan.args[0] === 'install') {
    await run(plan.command, [...plan.args, '--package-lock-only'], plan.target, false, npmConfigs);
    const initial = await safeRead(plan.target, 'package-lock.json');
    verifyLock(initial, plan.manifest, plan.resolution, await verifyBundles(initial, plan.resolution));
  }
  await run(plan.command, ['ci', ...plan.args.slice(1)], plan.target, false, npmConfigs);
  const lock = await safeRead(plan.target, 'package-lock.json');
  const bundles = await verifyBundles(lock, plan.resolution);
  verifyLock(lock, plan.manifest, plan.resolution, bundles);
  if (plan.resolution?.bazel) {
    const yaml = npmToBazelLock(lock, plan.manifest);
    verifyPnpm(yaml, lock, plan.manifest);
    const lockPath = path.join(plan.target, 'pnpm-lock.yaml');
    try {
      const info = await lstat(lockPath);
      if (!info.isFile() || info.isSymbolicLink()) throw new Diagnostic('PATH', 'Refusing linked pnpm lockfile.');
      const previous = await safeRead(plan.target, 'fresh-stack-install.json');
      if (previous.lockHashes?.['pnpm-lock.yaml'] !== createHash('sha256').update(await readFile(lockPath)).digest('hex')) throw new Diagnostic('LOCK', 'Existing pnpm lock is not owned by the previous verified install; inspect manually.');
      const temp = path.join(plan.target, `.pnpm-lock-${randomUUID()}`);
      try { await writeFile(temp, yaml, { flag: 'wx' }); await rename(temp, lockPath); } finally { await rm(temp, { force: true }); }
    } catch (error) { if (error.code !== 'ENOENT') throw error; await writeFile(lockPath, yaml, { flag: 'wx' }); }
  }
  await run('npm', ['ls', '--all', '--json', '--global=false', `--prefix=${plan.target}`], plan.target, true, npmConfigs);
  const receipt = path.join(plan.target, `.fresh-stack-install-${randomUUID()}.json`);
  try {
  await writeFile(receipt, `${JSON.stringify({ generator: 'fresh-stack@0.1.0', installedAt: new Date().toISOString(), lockHashes: await lockHashes(plan.target, plan.resolution?.bazel), command: [plan.command, ...plan.args], verifiedBundles: bundles, verified: ['exact root lock versions', plan.resolution.preset === 'cloudflare-alchemy' ? 'stable graph except explicitly reviewed Alchemy ecosystem prereleases' : plan.resolution.preset === 'tanstack-convex-workos' ? 'stable graph except explicitly selected reviewed TanStack runtime/toolchain prereleases' : 'stable transitive graph before installation', 'strict npm peer resolution', 'strict npm engine checks', 'npm ls --all'], lifecycleScripts: false, npmConfiguration: 'isolated temporary empty user and global configs; inherited npm_config settings stripped' }, null, 2)}\n`, { flag: 'wx' });
  await rename(receipt, path.join(plan.target, 'fresh-stack-install.json'));
  } finally { await rm(receipt, { force: true }); }
  } finally { await rm(configDir, { recursive: true, force: true }); }
}

export function verifyPnpm(source, npmLock, manifest) {
  const lock = parseYaml(source);
  const expectedGraph = parseYaml(npmToBazelLock(npmLock, manifest));
  if (JSON.stringify(lock.packages) !== JSON.stringify(expectedGraph.packages)) throw new Diagnostic('LOCK', 'Bazel package metadata differs from the verified npm graph.');
  if (JSON.stringify(lock.snapshots) !== JSON.stringify(expectedGraph.snapshots)) throw new Diagnostic('LOCK', 'Bazel snapshots differ from the verified npm dependency graph.');
  if (String(lock.lockfileVersion) !== '9.0' || !lock.importers?.['.']) throw new Diagnostic('LOCK', 'Unsupported pnpm imported lock format.');
  for (const group of ['dependencies', 'devDependencies']) {
    const imported = lock.importers['.'][group] ?? {};
    if (Object.keys(imported).sort().join() !== Object.keys(manifest[group] ?? {}).sort().join()) throw new Diagnostic('LOCK', 'pnpm root package set differs from npm.');
    for (const [name, version] of Object.entries(manifest[group] ?? {})) if (imported[name].specifier !== version || imported[name].version.split('(')[0] !== version) throw new Diagnostic('LOCK', `pnpm root ${name} differs from npm.`);
  }
  const allowed = new Map(Object.entries(npmLock.packages).filter(([name]) => name).map(([name, meta]) => [name.slice(name.lastIndexOf('node_modules/') + 13) + '@' + meta.version, meta.integrity]));
  for (const [name, meta] of Object.entries(lock.packages ?? {})) if (!allowed.has(name) || meta.resolution?.integrity !== allowed.get(name) || Object.keys(meta.resolution).some(key => key !== 'integrity')) throw new Diagnostic('LOCK', `pnpm import changed archive/version/source: ${name}.`);
  for (const name of Object.keys(lock.snapshots ?? {})) if (!allowed.has(name.split('(')[0])) throw new Diagnostic('LOCK', `Unrecognized pnpm snapshot ${name}.`);
  if ([...allowed.keys()].some(name => !lock.packages[name])) throw new Diagnostic('LOCK', 'pnpm import dropped an npm package.');
}
export async function lockHashes(target, bazel) {
  return Object.fromEntries(await Promise.all(['package-lock.json', ...(bazel ? ['pnpm-lock.yaml'] : [])].map(async name => [name, createHash('sha256').update(await readFile(path.join(target, name))).digest('hex')])));
}
