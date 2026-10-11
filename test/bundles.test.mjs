import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { c } from 'tar';
import { verifyBundles } from '../src/bundles.mjs';
import { verifyLock } from '../src/install.mjs';
import { npmToBazelLock } from '../src/npm-bazel-lock.mjs';
const original = JSON.parse(await readFile(new URL('./fixtures/tailwind-bundled-lock.json', import.meta.url)));
const bytes = await readFile(new URL('./fixtures/tailwind-oxide-wasm4.3.3.tgz', import.meta.url));
const resolution = { preset: 'tanstack-convex-workos' }, options = { getBytes: async () => bytes }, anchor = 'node_modules/@tailwindcss/oxide-wasm32-wasi';
test('real bundled Tailwind archive provides collective source proof before npm install', async () => {
  const proof = await verifyBundles(original, resolution, options);
  assert.equal(Object.keys(proof).length, 6);
  assert.throws(() => verifyLock(original, original.packages[''], resolution), e => e.code === 'LOCK');
  assert.doesNotThrow(() => verifyLock(original, original.packages[''], resolution, proof));
});
test('bundle flags cannot bypass archive verification or unsupported parents', async () => {
  for (const edit of [l => l.packages[anchor].version = '4.3.4', l => l.packages[anchor].resolved = 'https://evil.invalid/archive', l => l.packages['node_modules/untrusted'] = { version: '1.0.0', inBundle: true }]) { const l = structuredClone(original); edit(l); await assert.rejects(verifyBundles(l, resolution, options), e => e.code === 'ADAPTER'); }
  await assert.rejects(verifyBundles(original, { preset: 'convex-effect' }, options), e => e.code === 'ADAPTER');
  await assert.rejects(verifyBundles(original, resolution, { getBytes: async () => Buffer.from('corrupt') }), e => e.code === 'INTEGRITY');
});
test('bundle package sets, metadata and dependency edges must match the archive', async () => {
  for (const edit of [l => delete l.packages[anchor+'/node_modules/tslib'], l => l.packages[anchor].bundleDependencies.pop(), l => l.packages[anchor+'/node_modules/tslib'].version = '2.8.2', l => l.packages[anchor+'/node_modules/@emnapi/core'].dependencies.tslib = '^3', l => l.packages[anchor+'/node_modules/tslib'].resolved = 'https://registry.npmjs.org/tslib']) { const l = structuredClone(original); edit(l); await assert.rejects(verifyBundles(l, resolution, options), e => e.code === 'LOCK'); }
});
test('bundled archive links and unexpected manifests are rejected as data', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'fresh-bundle-')); t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'package'), { recursive: true });
  await symlink('/tmp/untrusted', path.join(dir, 'package/unsafe'));
  const chunks=[]; for await (const chunk of c({ gzip:true, cwd:dir }, ['package'])) chunks.push(chunk);
  const data=Buffer.concat(chunks), lock=structuredClone(original); lock.packages[anchor].integrity='sha512-'+createHash('sha512').update(data).digest('base64');
  await assert.rejects(verifyBundles(lock, resolution, {getBytes:async()=>data}), e=>e.code==='ARCHIVE');
  await rm(path.join(dir,'package/unsafe'));
  await mkdir(path.join(dir,'package/node_modules/a/node_modules/b'),{recursive:true});
  await writeFile(path.join(dir,'package/node_modules/a/node_modules/b/package.json'),'{}');
  const nested=[];for await(const chunk of c({gzip:true,cwd:dir},['package']))nested.push(chunk);
  const nestedBytes=Buffer.concat(nested);lock.packages[anchor].integrity='sha512-'+createHash('sha512').update(nestedBytes).digest('base64');
  await assert.rejects(verifyBundles(lock,resolution,{getBytes:async()=>nestedBytes}),e=>e.code==='ARCHIVE');
});
test('Bazel refuses bundled npm graph until a real translation adapter exists', () => {
  assert.throws(() => npmToBazelLock(original, original.packages['']), e => e.code === 'BAZEL_LOCK');
});
