import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { c } from 'tar';
import { upstreamTemplate } from '../src/upstream.mjs';
const meta = bytes => ({ integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`, tarball: 'https://registry.npmjs.org/create-vite/-/create-vite-9.2.1.tgz' });
const fetcher = bytes => async () => ({ ok: true, arrayBuffer: async () => bytes });
const archive = new URL('../research/create-vite-9.2.1.tgz', import.meta.url);
test('reviewed real upstream scaffold archive reads without execution', async () => {
  const bytes = await readFile(archive); const files = await upstreamTemplate(meta(bytes), { fetcher: fetcher(bytes) });
  assert.ok(files['index.html'].includes('/src/main.ts'));
  assert.ok(JSON.parse(files['package.json']).private);
});
test('upstream integrity and foreign hosts fail', async () => {
  const bytes = await readFile(archive); const bad = meta(bytes); bad.integrity = 'sha512-corrupt';
  await assert.rejects(upstreamTemplate(bad, { fetcher: fetcher(bytes) }), e => e.code === 'INTEGRITY');
  await assert.rejects(upstreamTemplate({ ...meta(bytes), tarball: 'https://evil.test/archive.tgz' }), e => e.code === 'ARCHIVE');
});
test('unexpected template paths are rejected rather than extracted', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'fresh-archive-')); t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'package/template-vanilla-ts'), { recursive: true });
  await writeFile(path.join(dir, 'package/template-vanilla-ts/unknown.js'), 'throw new Error("must never run")');
  const chunks = []; for await (const chunk of c({ gzip: true, cwd: dir }, ['package'])) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  await assert.rejects(upstreamTemplate(meta(bytes), { fetcher: fetcher(bytes) }), e => e.code === 'ADAPTER');
});
