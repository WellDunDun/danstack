import { createHash } from 'node:crypto';
import { Parser } from 'tar';
import { Diagnostic, REGISTRY, request } from './resolve.mjs';

// Only data files from the released create-vite vanilla TypeScript scaffold are read.
export async function upstreamTemplate(meta, options = {}) {
  const url = new URL(meta.tarball);
  if (url.origin !== REGISTRY || url.username || url.password)
    throw new Diagnostic('ARCHIVE', 'Upstream archive must come from the official npm registry.');
  const response = await request(url.href, options);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 5_000_000) throw new Diagnostic('ARCHIVE', 'Upstream scaffold archive exceeds the 5 MB limit.');
  const match = /^sha512-([A-Za-z0-9+/=]+)$/.exec(meta.integrity);
  if (!match || createHash('sha512').update(bytes).digest('base64') !== match[1])
    throw new Diagnostic('INTEGRITY', 'create-vite archive integrity did not match registry metadata.');
  const files = {};
  const root = 'package/template-vanilla-ts/';
  const expected = new Set(['_gitignore', 'index.html', 'package.json', 'tsconfig.json', 'src/main.ts', 'src/style.css', 'src/counter.ts', 'src/assets/hero.png', 'src/assets/typescript.svg', 'src/assets/vite.svg', 'public/favicon.svg', 'public/icons.svg']);
  const parser = new Parser({ onReadEntry(entry) {
    if (!entry.path.startsWith(root)) { entry.resume(); return; }
    const name = entry.path.slice(root.length);
    if (entry.type === 'Directory') { entry.resume(); return; }
    if (entry.type !== 'File' || !expected.has(name) || name.includes('..') || Object.hasOwn(files, name)) {
      parser.abort(new Diagnostic('ADAPTER', `Unexpected upstream template entry ${entry.path} (${entry.type}); update the adapter.`));
      entry.resume(); return;
    }
    const chunks = [];
    entry.on('data', c => chunks.push(c));
    entry.on('end', () => { files[name] = Buffer.concat(chunks).toString('utf8'); });
  }});
  await new Promise((ok, fail) => { parser.on('end', ok); parser.on('error', fail); parser.end(bytes); });
  if ([...expected].some(f => !Object.hasOwn(files, f))) throw new Diagnostic('ADAPTER', 'Upstream create-vite template shape changed; update the adapter.');
  return files;
}
