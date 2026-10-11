import { readFile, lstat, mkdir, writeFile, chmod, rename, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
const [command, ...targets] = process.argv.slice(2);
if (!['setup', 'build', 'test', 'clean'].includes(command)) throw new Error('Use setup, build, test, or clean');
if ((command === 'setup' || command === 'clean') && targets.length) throw new Error('Unexpected target');
if (targets.some(t => !['//:bundle', '//:unit', '//:typecheck'].includes(t))) throw new Error('Only the authored bundle/unit/typecheck targets are accepted');
if (command !== 'setup') {
  const receipt = JSON.parse(await readFile('fresh-stack-install.json', 'utf8'));
  for (const name of ['package-lock.json', 'pnpm-lock.yaml']) {
    const info = await lstat(name);
    if (!info.isFile() || info.isSymbolicLink() || createHash('sha256').update(await readFile(name)).digest('hex') !== receipt.lockHashes?.[name]) throw new Error(`Changed or unverified ${name}; rerun the generator install after review`);
  }
}
const resolution = JSON.parse(await readFile('fresh-stack.json', 'utf8'));
const platform = `${process.platform}-${{ arm64: 'arm64', x64: process.platform === 'darwin' ? 'x86_64' : 'x86_64' }[process.arch]}`;
const vendor = resolution.buildTools.bazel.assets[platform];
if (!vendor) throw new Error(`Unsupported Bazel platform ${platform}`);
for (const dir of ['.bazel-tools', '.bazel-cache']) {
  try { const info = await lstat(dir); if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe ${dir}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await mkdir(dir); }
}
const binary = path.resolve('.bazel-tools/bazel');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  const info = await lstat(binary);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('Unsafe Bazel executable');
  if (hash(await readFile(binary)) !== vendor.sha256) throw new Error('Existing Bazel differs from recorded vendor checksum; inspect manually');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  if (command !== 'setup') throw new Error('Run npm run bazel:setup first');
  const url = new URL(vendor.url);
  if (url.origin !== 'https://github.com' || !url.pathname.startsWith('/bazelbuild/bazel/releases/download/')) throw new Error('Unexpected vendor URL');
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Bazel download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (hash(bytes) !== vendor.sha256) throw new Error('Bazel SHA256 mismatch');
  const temporary = path.resolve(`.bazel-tools/.download-${randomUUID()}`);
  try { await writeFile(temporary, bytes, { flag: 'wx' }); await chmod(temporary, 0o755); await rename(temporary, binary); }
  finally { await rm(temporary, { force: true }); }
}
if (command === 'setup') { console.log(`Verified local Bazel ${resolution.buildTools.bazel.version}`); }
else {
  const child = spawn(binary, ['--nosystem_rc', '--nohome_rc', `--output_user_root=${path.resolve('.bazel-cache')}`, command, ...['--repo_contents_cache='], ...targets], { stdio: 'inherit', shell: false, env: { ...process.env, DO_NOT_TRACK: '1', ASPECT_TELEMETRY_DISABLED: '1' } });
  child.on('error', error => { console.error(error); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
