import { stringify } from 'yaml';
import { Diagnostic } from './resolve.mjs';
// rules_js consumes pnpm v9 locks. Preserve the npm graph; never re-resolve it.
// Multiple installations of a package/version with different resolution contexts
// cannot share a snapshot here and are rejected rather than flattened incorrectly.
export function npmToBazelLock(lock, manifest) {
  const packages = {}, snapshots = {}, archives = {}, importers = { '.': {} };
  const canonicalMetadata = value => JSON.stringify(value);
  const keyFor = location => {
    const meta = lock.packages[location];
    if (!meta) throw new Diagnostic('LOCK', `Missing npm node ${location}.`);
    const name = location.slice(location.lastIndexOf('node_modules/') + 13);
    if (meta.name && meta.name !== name) throw new Diagnostic('BAZEL_LOCK', `npm alias ${name} -> ${meta.name} is outside the reviewed lock adapter.`);
    return { name, version: meta.version, key: `${name}@${meta.version}` };
  };
  const lookup = (from, name) => {
    let parent = from;
    while (true) {
      const candidate = `${parent ? parent + '/' : ''}node_modules/${name}`;
      if (lock.packages[candidate]) return keyFor(candidate);
      if (!parent) return undefined;
      const index = parent.lastIndexOf('/node_modules/');
      parent = index < 0 ? '' : parent.slice(0, index);
    }
  };
  for (const [location, meta] of Object.entries(lock.packages)) {
    if (!location) continue;
    if (meta.inBundle) throw new Diagnostic('BAZEL_LOCK', 'Bundled npm packages are outside the reviewed Bazel translation adapter.');
    const { key } = keyFor(location);
    const pkg = { resolution: { integrity: meta.integrity } };
    for (const field of ['engines', 'os', 'cpu', 'libc']) if (meta[field]) pkg[field] = meta[field];
    if (meta.bin) pkg.hasBin = true;
    const identity = JSON.stringify({ resolved: meta.resolved, integrity: meta.integrity, metadata: canonicalMetadata(pkg) });
    if (archives[key] && archives[key] !== identity) throw new Diagnostic('BAZEL_LOCK', `Different archive or package metadata for ${key}; refusing to collapse nodes.`);
    archives[key] = identity;
    packages[key] = pkg;
    const snapshot = {};
    for (const group of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const name of Object.keys(meta[group] ?? {}).sort()) {
        const target = lookup(location, name);
        const optional = group === 'optionalDependencies' || meta.peerDependenciesMeta?.[name]?.optional;
        if (!target) { if (optional) continue; throw new Diagnostic('BAZEL_LOCK', `Missing ${group} ${name} of ${location}.`); }
        const destination = group === 'optionalDependencies' ? 'optionalDependencies' : 'dependencies';
        (snapshot[destination] ??= {})[name] = target.version;
      }
    }
    const canonical = value => JSON.stringify(Object.fromEntries(Object.entries(value).sort().map(([k,v]) => [k,Object.fromEntries(Object.entries(v).sort())])));
    if (snapshots[key] && canonical(snapshots[key]) !== canonical(snapshot)) throw new Diagnostic('BAZEL_LOCK', `Different dependency contexts for ${key}; current adapter refuses to flatten them. Use npm builds or update the adapter.`);
    snapshots[key] = snapshot;
  }
  for (const group of ['dependencies', 'devDependencies']) {
    const values = {};
    for (const [name, version] of Object.entries(manifest[group] ?? {}).sort()) values[name] = { specifier: version, version };
    if (Object.keys(values).length) importers['.'][group] = values;
  }
  return stringify({ lockfileVersion: '9.0', settings: { autoInstallPeers: false, excludeLinksFromLockfile: false }, importers, packages, snapshots });
}
