import { createHash } from 'node:crypto';
import { Parser } from 'tar';
import semver from 'semver';
import { Diagnostic, REGISTRY, request } from './resolve.mjs';
const anchor = 'node_modules/@tailwindcss/oxide-wasm32-wasi';
const canonical = value => JSON.stringify(value, (key, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
export async function verifyBundles(lock, resolution, { getBytes = async url => Buffer.from(await (await request(url)).arrayBuffer()) } = {}) {
  const entries = Object.entries(lock.packages).filter(([, m]) => m.inBundle);
  if (!entries.length) return {};
  const parent = lock.packages[anchor];
  if (resolution.preset !== 'tanstack-convex-workos' || !parent || parent.version !== '4.3.3' || parent.link || parent.resolved !== `${REGISTRY}/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz` || !/^sha512-[A-Za-z0-9+/=]+$/.test(parent.integrity ?? '') || entries.some(([name]) => !name.startsWith(anchor + '/node_modules/')))
    throw new Diagnostic('ADAPTER', 'Unreviewed bundled dependency parent/version; only the reviewed Tailwind 4.3.3 WASM archive is supported.');
  const bytes = await getBytes(parent.resolved);
  if (bytes.length > 5_000_000 || createHash('sha512').update(bytes).digest('base64') !== parent.integrity.slice(7)) throw new Diagnostic('INTEGRITY', 'Bundled parent archive size/integrity failed.');
  const manifests = {}, seen = new Set(); let total = 0, count = 0;
  const parser = new Parser({ onReadEntry(entry) {
    if (++count > 5000 || seen.has(entry.path) || entry.path.startsWith('/') || entry.path.includes('\\') || entry.path.split('/').some(p => p === '..' || p === '.') || !['File', 'Directory'].includes(entry.type)) { parser.abort(new Diagnostic('ARCHIVE', 'Unsafe/duplicate bundled archive entry.')); entry.resume(); return; }
    seen.add(entry.path);
    if (entry.path.endsWith('/package.json') && entry.path.startsWith('package/node_modules/') && entry.path.slice('package/node_modules/'.length).includes('/node_modules/')) { parser.abort(new Diagnostic('ARCHIVE', 'Nested bundled package manifests are outside the reviewed adapter.')); entry.resume(); return; }
    const capture = entry.path === 'package/package.json' || /^package\/node_modules\/(?:@[^/]+\/)?[^/]+\/package.json$/.test(entry.path);
    const chunks = []; let size = 0;
    entry.on('data', chunk => { total += chunk.length; size += chunk.length; if (total > 40_000_000 || (capture && size > 100_000)) parser.abort(new Diagnostic('ARCHIVE', 'Bundled archive decompression/manifest limit exceeded.')); if (capture) chunks.push(chunk); });
    entry.on('end', () => { if (capture) { try { manifests[entry.path] = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { parser.abort(new Diagnostic('ARCHIVE', 'Invalid bundled package manifest.')); } } });
  }});
  await new Promise((ok, fail) => { parser.on('end', ok); parser.on('error', fail); parser.end(bytes); });
  const root = manifests['package/package.json'];
  if (root?.bundleDependencies && root?.bundledDependencies && canonical([...root.bundleDependencies].sort()) !== canonical([...root.bundledDependencies].sort())) throw new Diagnostic('ARCHIVE', 'Conflicting bundle declarations.');
  const declared = root?.bundleDependencies ?? root?.bundledDependencies;
  if (root?.name !== '@tailwindcss/oxide-wasm32-wasi' || root.version !== parent.version || !Array.isArray(declared) || new Set(declared).size !== declared.length || canonical([...declared].sort()) !== canonical([...(parent.bundleDependencies ?? [])].sort())) throw new Diagnostic('LOCK', 'Bundled parent manifest/declaration differs from lock.');
  const expected = declared.map(name => `${anchor}/node_modules/${name}`).sort();
  if (canonical(expected) !== canonical(entries.map(([name]) => name).sort()) || canonical(Object.keys(manifests).filter(n => n !== 'package/package.json').sort()) !== canonical(declared.map(n => `package/node_modules/${n}/package.json`).sort())) throw new Diagnostic('LOCK', 'Bundled archive/lock package sets differ.');
  const proof = {};
  for (const [name, meta] of [[anchor, parent], ...entries]) {
    const pkgName = name === anchor ? root.name : name.slice((anchor + '/node_modules/').length);
    const manifest = name === anchor ? root : manifests[`package/node_modules/${pkgName}/package.json`];
    if (manifest.name !== pkgName || manifest.version !== meta.version || !semver.valid(meta.version) || semver.prerelease(meta.version) || meta.link || (name !== anchor && (meta.resolved || meta.integrity))) throw new Diagnostic('LOCK', `Bundled version/source differs: ${name}.`);
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta', 'engines', 'os', 'cpu', 'libc', 'bin']) if (canonical(manifest[field] ?? {}) !== canonical(meta[field] ?? {})) throw new Diagnostic('LOCK', `Bundled ${field} differs: ${name}.`);
    for (const [dep, range] of Object.entries({ ...manifest.dependencies, ...manifest.peerDependencies })) {
      const target = lock.packages[`${anchor}/node_modules/${dep}`];
      if (!target || !semver.validRange(range) || !semver.satisfies(target.version, range)) throw new Diagnostic('LOCK', `Bundled dependency edge ${pkgName} -> ${dep} is incompatible.`);
    }
    if (name !== anchor) proof[name] = { version: meta.version, parent: anchor, integrity: parent.integrity };
  }
  return proof;
}
