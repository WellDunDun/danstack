import { createHash } from 'node:crypto';
import { Diagnostic, request } from './resolve.mjs';

// Audited current official base-nova source. New executable registry code needs
// adapter review; never accept remote scripts solely because markers match.
export const shadcnHashes = {
  button: '313353436d0fcc8e44ab470adb614b9fd013d28626f624328ea0d66d41a6c81b',
  card: '645c3d73e387a99f1492220cc619453b0c7f5454134ee3cd548be7a80f7eccde',
  input: 'dab990dfefa0ba78854ab6602ad074270dba9d7d1262184d9bfbb62bd990903b',
};
export async function shadcnComponents({ getText = async url => (await request(url)).text() } = {}) {
  const files = {}, components = [];
  for (const [name, expected] of Object.entries(shadcnHashes)) {
    const url = `https://ui.shadcn.com/r/styles/base-nova/${name}.json`;
    const raw = await getText(url);
    if (Buffer.byteLength(raw) > 100_000) throw new Diagnostic('ADAPTER', `shadcn ${name} registry item exceeds reviewed size.`);
    let item;
    try { item = JSON.parse(raw); } catch { throw new Diagnostic('REGISTRY', `Invalid shadcn ${name} registry JSON.`); }
    const allowed = new Set(['$schema', 'name', 'type', 'dependencies', 'files', 'meta']);
    if (!item || Object.keys(item).some(k => !allowed.has(k)) || item.name !== name || item.type !== 'registry:ui' || JSON.stringify(item.dependencies) !== '["cn"]' || !Array.isArray(item.files) || item.files.length !== 1)
      throw new Diagnostic('ADAPTER', `shadcn ${name} registry structure/dependencies changed; review before generation.`);
    const file = item.files[0];
    if (Object.keys(file).sort().join() !== 'content,path,type' || file.path !== `registry/base-nova/ui/${name}.tsx` || file.type !== 'registry:ui' || typeof file.content !== 'string')
      throw new Diagnostic('ADAPTER', `Unsafe or unreviewed shadcn ${name} file/target.`);
    const sha256 = createHash('sha256').update(file.content).digest('hex');
    if (sha256 !== expected) throw new Diagnostic('ADAPTER', `Current shadcn ${name} source changed beyond the reviewed adapter; review its API before generation.`, { url, expected, observed: sha256 });
    const target = `src/components/ui/${name}.tsx`;
    files[target] = file.content;
    components.push({ name, url, sha256, target });
  }
  return { files, receipt: { style: 'base-nova', readAt: new Date().toISOString(), components, policy: 'current official registry data; exact audited executable source; fixed local targets; no init/add execution, registry dependencies, config/env writes or remote scripts' } };
}
