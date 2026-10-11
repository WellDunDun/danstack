import semver from 'semver';

export class Diagnostic extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}
export const REGISTRY = 'https://registry.npmjs.org';
export const adapters = {
  convex: '>=1.46.0 <2', effect: '>=4.0.2 <5', vite: '>=8.3.4 <9',
  typescript: '>=7.0.2 <8', 'create-vite': '>=9.2.1 <10',
  '@types/node': '>=26.6.5 <27', tsx: '>=4 <5', 'convex-test': '>=0.0.61 <0.0.62',
  '@confect/core': '>=10.2.0 <10.3', '@confect/server': '>=10.2.0 <10.3',
  '@confect/cli': '>=10.2.0 <10.3', e2e: '>=0.19.0 <0.20', '@e2e-dev/web': '>=0.14.0 <0.15',
  alchemy: '2.0.0-beta.81', '@alchemy.run/cloudflare-runtime': '2.0.0-beta.81', '@distilled.cloud/cloudflare': '1.0.0-rc.13', '@effect/platform-node': '>=4.0.2 <5', '@effect/platform-node-shared': '>=4.0.2 <5', '@effect/sql-d1': '>=4.0.0 <5', '@effect/sql-sqlite-do': '>=4.0.0 <5', redis: '>=6.3.0 <7',
  'create-convex': '>=0.0.47 <0.0.48', '@convex-dev/react-query': '0.1.0',
  '@tanstack/react-start': '>=1.168.61 <1.169', '@tanstack/react-router': '>=1.170.42 <1.171',
  '@tanstack/react-router-ssr-query': '>=1.167.3 <1.168', '@tanstack/react-query': '>=5.104.1 <6', '@tanstack/query-core': '>=5.104.1 <6',
  '@tanstack/router-cli': '>=1.167.41 <1.168', '@workos/authkit-tanstack-react-start': '>=0.11.1 <0.12', '@workos-inc/node': '>=10.7.0 <12',
  react: '>=19.3.0 <20', 'react-dom': '>=19.3.0 <20', '@types/react': '>=19.3.0 <20', '@types/react-dom': '>=19.3.0 <20',
  '@vitejs/plugin-react': '>=6.1.2 <7', 'vite-tsconfig-paths': '>=6.1.1 <7', dotenv: '>=18.0.7 <19',
  tailwindcss: '>=4.3.3 <5', '@tailwindcss/vite': '>=4.3.3 <5',
  shadcn: '>=4.21.4 <4.22', cn: '>=0.2.4 <0.5', 'class-variance-authority': '>=0.7.1 <0.8',
  'lucide-react': '>=1.55.0 <2', 'tw-animate-css': '>=1.4.0 <2', '@base-ui/react': '>=1.9.0 <2',
};
export const presets = ['convex-effect', 'convex-confect', 'cloudflare-alchemy', 'tanstack-convex-workos'];
// Reviewed beta.81 dependency chain, not a wildcard prerelease exception.
export const alchemyPrereleases = {
  alchemy: '2.0.0-beta.81',
  ...Object.fromEntries(['cloudflare-runtime', 'floci', 'node-utils'].map(n => [`@alchemy.run/${n}`, '2.0.0-beta.81'])),
  '@alchemy.run/sigil': '0.1.0-alpha.1',
  ...Object.fromEntries(['acme', 'aws', 'axiom', 'cloudflare', 'core', 'doppler', 'fly-io', 'gcp', 'hetzner', 'infisical', 'neon', 'planetscale', 'prisma', 'railway', 'stripe', 'zerossl'].map(n => [`@distilled.cloud/${n}`, '1.0.0-rc.13'])),
  unenv: '>=2.0.0-rc.24 <2.0.0',
};
// Stable Start 1.168.x requires this exact published H3 RC runtime alias.
// It is not a wildcard exception and requires explicit CLI selection.
export const tanstackPrereleases = { 'h3-v2': '2.0.1-rc.20', gensync: '1.0.0-beta.2' };
export function requirements(preset, e2e, bazel = false) {
  if (!presets.includes(preset)) throw new Diagnostic('ARGUMENT', `Unknown preset ${preset}. Choose ${presets.join(' or ')}.`);
  if (preset === 'tanstack-convex-workos' && bazel) throw new Diagnostic('COMBINATION', 'Bazel is not reviewed for the TanStack Start SSR/auth preset. Omit --bazel; npm build/typecheck/test and optional deterministic e2e are supported.');
  if (preset === 'tanstack-convex-workos') return {
    dependencies: ['convex', '@tanstack/react-start', '@workos/authkit-tanstack-react-start', '@workos-inc/node', '@tanstack/react-router', '@tanstack/react-router-ssr-query', '@tanstack/react-query', '@tanstack/query-core', '@convex-dev/react-query', 'react', 'react-dom', '@base-ui/react', 'cn', 'class-variance-authority', 'lucide-react', 'tw-animate-css'],
    devDependencies: ['vite', 'typescript', '@types/node', 'tsx', 'convex-test', '@tanstack/router-cli', '@vitejs/plugin-react', 'vite-tsconfig-paths', 'dotenv', '@types/react', '@types/react-dom', 'tailwindcss', '@tailwindcss/vite', 'shadcn', ...(e2e ? ['e2e', '@e2e-dev/web'] : [])],
    tools: ['create-convex'],
  };
  const dependencies = preset === 'cloudflare-alchemy' ? ['effect', 'alchemy', '@alchemy.run/cloudflare-runtime', '@distilled.cloud/cloudflare', '@effect/platform-node', '@effect/platform-node-shared', '@effect/sql-d1', '@effect/sql-sqlite-do', 'redis'] : ['convex', 'effect'];
  const devDependencies = ['vite', 'typescript', '@types/node', 'tsx', ...(preset === 'cloudflare-alchemy' ? [] : ['convex-test'])];
  if (preset === 'convex-confect') {
    dependencies.push('@confect/core', '@confect/server');
    devDependencies.push('@confect/cli');
  }
  if (e2e) devDependencies.push('e2e', '@e2e-dev/web');
  // Bazel reads a deterministic translation of the installed npm lock.
  return { dependencies, devDependencies, tools: ['create-vite'] };
}
export async function request(url, { fetcher = fetch, timeout = 15000 } = {}) {
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(timeout), redirect: 'error' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (error) {
    throw new Diagnostic('REGISTRY', `Could not retrieve ${url}: ${error.message}. Check network access; no cached fallback or downgrade was used.`);
  }
}
export function registryReader(options = {}) {
  return async (name) => {
    const response = await request(`${REGISTRY}/${encodeURIComponent(name)}`, options);
    try { return await response.json(); }
    catch { throw new Diagnostic('REGISTRY', `Invalid registry JSON for ${name}.`); }
  };
}
const inChannel = (name, version) => ['alchemy', '@alchemy.run/cloudflare-runtime'].includes(name)
  ? /^2\.0\.0-beta\.\d+$/.test(version)
  : name === '@distilled.cloud/cloudflare' ? (!semver.prerelease(version) || /^1\.0\.0-rc\.\d+$/.test(version)) : !semver.prerelease(version);
function metadata(name, version, raw, names) {
  if (!raw || raw.name !== name || raw.version !== version || !raw.dist?.integrity || !raw.dist?.tarball)
    throw new Diagnostic('REGISTRY', `Incomplete or mismatched release metadata for ${name}@${version}.`);
  try { if (new URL(raw.dist.tarball).origin !== REGISTRY) throw new Error(); }
  catch { throw new Diagnostic('REGISTRY', `Unexpected archive source for ${name}@${version}.`); }
  for (const field of ['peerDependencies', 'peerDependenciesMeta', 'engines', 'dependencies']) if (raw[field] !== undefined && (!raw[field] || typeof raw[field] !== 'object' || Array.isArray(raw[field])))
    throw new Diagnostic('REGISTRY', `Malformed ${field} for ${name}@${version}.`);
  const peers = raw.peerDependencies ?? {};
  const optionalPeers = Object.keys(raw.peerDependenciesMeta ?? {}).filter(p => raw.peerDependenciesMeta[p]?.optional === true);
  for (const [peer, range] of Object.entries(peers)) {
    if (typeof range !== 'string' || !range.trim() || !semver.validRange(range)) throw new Diagnostic('PEER', `Malformed peer range ${peer} for ${name}@${version}.`, {name, version, peer, range});
    if (!names.includes(peer) && !optionalPeers.includes(peer)) throw new Diagnostic('ADAPTER', `${name}@${version} requires peer ${peer} outside this reviewed preset.`, {name, version, peer});
  }
  for (const [engine, range] of Object.entries(raw.engines ?? {})) if (typeof range !== 'string' || !range.trim() || !semver.validRange(range))
    throw new Diagnostic('ENGINE', `Malformed ${engine} engine range for ${name}@${version}.`);
  const dependencies = Object.fromEntries(Object.entries(raw.dependencies ?? {}).filter(([dep]) => names.includes(dep)));
  for (const [dep, range] of Object.entries(dependencies)) if (typeof range !== 'string' || !semver.validRange(range)) throw new Diagnostic('ADAPTER', `Unsupported direct dependency range ${dep} of ${name}@${version}.`);
  return {version, integrity:raw.dist.integrity, tarball:raw.dist.tarball, engines:raw.engines??{}, peers, optionalPeers, dependencies};
}
export async function resolve({ preset, e2e = false, bazel = false, alchemyChannel, tanstackRuntime, read = registryReader(), node = process.versions.node, npm }) {
  if (preset === 'tanstack-convex-workos' && tanstackRuntime !== 'rc') throw new Diagnostic('CHANNEL', 'tanstack-convex-workos requires --tanstack-runtime rc: released Start requires H3 2.0.1-rc.20 and its Babel toolchain requires gensync 1.0.0-beta.2. Only these exact reviewed prereleases are allowed.');
  if (preset !== 'tanstack-convex-workos' && tanstackRuntime) throw new Diagnostic('CHANNEL', '--tanstack-runtime is only valid for tanstack-convex-workos.');
  if (preset === 'cloudflare-alchemy' && alchemyChannel !== 'beta') throw new Diagnostic('CHANNEL', 'cloudflare-alchemy requires explicit --alchemy-channel beta.');
  if (preset !== 'cloudflare-alchemy' && alchemyChannel) throw new Diagnostic('CHANNEL', '--alchemy-channel is only valid for cloudflare-alchemy.');
  const groups = requirements(preset, e2e, bazel);
  if (!semver.satisfies(node, '>=24.8.0') || !npm || !semver.satisfies(npm, '>=11')) throw new Diagnostic('ENGINE', `fresh-stack requires Node >=24.8.0 and npm >=11; current Node ${node}, npm ${npm ?? 'unknown'}.`);
  // Deterministic priority: preserve newest domain/backend dependencies first,
  // then supporting dependencies, then development tools. Never cross adapters.
  const names = [...new Set(Object.values(groups).flat())];
  const all = {}, candidates = {}, observations = {}, rejectedEngines = {};
  const records = await Promise.all(names.map(async name => [name, await read(name)]));
  for (const [name, packument] of records) {
    if (!adapters[name]) throw new Diagnostic('ADAPTER', `No reviewed adapter for ${name}.`);
    if (!packument?.versions || typeof packument.versions !== 'object' || Array.isArray(packument.versions)) throw new Diagnostic('REGISTRY', `Malformed versions for ${name}.`);
    const versions = semver.rsort(Object.keys(packument.versions).filter(v => semver.valid(v) && inChannel(name,v)));
    const latest = versions[0];
    if (!latest) throw new Diagnostic('RELEASE', `${name} has no published release in its permitted channel.`);
    if (!semver.satisfies(latest, adapters[name], {includePrerelease:true})) throw new Diagnostic('ADAPTER', `${name}@${latest} exceeds reviewed adapter ${adapters[name]}; review the new API before generation.`, {name, version:latest, supported:adapters[name]});
    observations[name] = {latestEligible:latest, distTagLatest:packument['dist-tags']?.latest??null};
    all[name] = versions.filter(v => semver.satisfies(v,adapters[name],{includePrerelease:true})).map(v => metadata(name,v,packument.versions[v],names));
    rejectedEngines[name] = [];
    candidates[name] = all[name].filter(meta => {
      const problems = Object.entries({node,npm}).filter(([engine,current]) => meta.engines[engine] && !semver.satisfies(current,meta.engines[engine])).map(([engine,current]) => ({kind:'engine',name,version:meta.version,engine,range:meta.engines[engine],current}));
      if (problems.length) rejectedEngines[name].push(...problems);
      return !problems.length;
    });
    if (!candidates[name].length) throw new Diagnostic('ENGINE', `No supported ${name} release fits Node ${node}/npm ${npm}.`, {constraints:rejectedEngines[name]});
  }
  const issues = (assignment, forward) => {
    const failures=[];
    for (const [name,meta] of Object.entries(assignment)) for (const [kind,edges] of [['peer',meta.peers],['dependency',meta.dependencies]]) for (const [peer,range] of Object.entries(edges)) {
      if (!names.includes(peer) && meta.optionalPeers.includes(peer)) continue;
      const available=assignment[peer] ? [assignment[peer]] : forward ? candidates[peer] : undefined;
      if (available && !available.some(v => semver.satisfies(v.version,range))) failures.push({kind,name,version:meta.version,peer,range,selected:assignment[peer]?.version,available:available.map(v=>v.version)});
    }
    return failures;
  };
  let visits=0;const conflicts=[];
  const search = (index, assignment) => {
    if (++visits>20000) throw new Diagnostic('RESOLUTION_LIMIT','Compatible-version search exceeded its limit; no approximate graph or fallback was generated.');
    const errors=issues(assignment,true);if(errors.length){if(conflicts.length<100)conflicts.push(...errors);return undefined;}
    if(index===names.length)return assignment;
    const name=names[index];for(const candidate of candidates[name]) {const result=search(index+1,{...assignment,[name]:candidate});if(result)return result;}
  };
  const selected=search(0,{});
  if(!selected)throw new Diagnostic('PEER','No supported compatible release combination exists; no incompatible app was generated.', {...conflicts[0],conflicts});
  const selections=[];
  for(const name of names){const meta=selected[name], observed=observations[name];
    if(meta.version!==observed.latestEligible || (semver.valid(observed.distTagLatest)&&semver.lt(meta.version,observed.distTagLatest))){
      const alternative=all[name].find(v=>v.version===observed.latestEligible);
      const reasons=meta.version!==observed.latestEligible ? [...rejectedEngines[name].filter(p=>p.version===observed.latestEligible),...issues({...selected,[name]:alternative},false)] : [{kind:'channel',name,distTagLatest:observed.distTagLatest,permitted:'stable, except explicitly reviewed Alchemy ecosystem channel'}];
      selections.push({name,selected:meta.version,...observed,reasons});
    }
    selected[name]={...meta,...observed};
  }
  return {schemaVersion:1,generator:'fresh-stack@0.1.0',preset,e2e,bazel,...(alchemyChannel?{alchemyChannel}:{}),...(tanstackRuntime?{tanstackRuntime,permittedPrereleases:tanstackPrereleases}:{}),resolvedAt:new Date().toISOString(),registry:REGISTRY,runtime:{node,npm},policy:'newest compatible published releases within reviewed adapters; stable ordinary packages; explicit reviewed ecosystem prerelease selections; every below-latest selection disclosed',selectionOrder:names,selections,groups,packages:selected};
}
