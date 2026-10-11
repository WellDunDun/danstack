import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyLock } from '../src/install.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const receipts = path.join(root, 'receipts');
await mkdir(receipts, { recursive: true });
const ui = process.argv.includes('--with-ui');
const summary = { verifiedAt: new Date().toISOString(), cwd: root, runtime: { node: process.versions.node }, samples: {}, limits: ['No cloud deployment or provisioning was attempted.', 'Convex deployment-backed codegen is blocked by absent deployment prerequisites.', 'convex-test proves in-process registered function behavior, not a deployed backend.', 'UI smoke tests exercise the labelled local Effect mode; no model providers or agent steps.'] };
let failed = false;
async function screenshots(dir) {
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) found.push(...await screenshots(file));
    else if (item.name.endsWith('.png')) found.push(file);
  }
  return found;
}
for (const name of ['effect-demo', 'confect-demo']) {
  const cwd = path.join(root, 'samples', name);
  const manifest = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'));
  const resolved = JSON.parse(await readFile(path.join(cwd, 'fresh-stack.json'), 'utf8'));
  const lock = JSON.parse(await readFile(path.join(cwd, 'package-lock.json'), 'utf8'));
  verifyLock(lock, manifest);
  const checks = [];
  const env = { ...process.env, E2E_TELEMETRY_DISABLED: '1', PLAYWRIGHT_BROWSERS_PATH: path.join(root, '.browsers') };
  delete env.CONVEX_DEPLOYMENT; delete env.CONVEX_SELF_HOSTED_URL;
  const commands = [...(name === 'confect-demo' ? [['codegen', ['run', 'codegen:local'], 0]] : []), ['typecheck', ['run', 'typecheck'], 0], ['unit', ['test'], 0], ['build', ['run', 'build'], 0], ['backend-codegen-prerequisite', ['run', 'backend:codegen'], 2], ...(ui ? [['ui', ['run', 'test:ui'], 0]] : []), ['dependency-tree', ['ls', '--all', '--json'], 0]];
  for (const [label, args, expected] of commands) {
    const result = spawnSync('npm', args, { cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 8_000_000 });
    const receipt = `${name.replace('-demo', '')}-${label}.${label === 'dependency-tree' ? 'json' : 'txt'}`;
    await writeFile(path.join(receipts, receipt), (result.stdout ?? '') + (result.stderr ?? '') + (result.error ? `\n${result.error.message}\n` : ''));
    const pass = result.status === expected;
    checks.push({ check: label, command: ['npm', ...args], exitCode: result.status, expectedExitCode: expected, passed: pass, receipt });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: ${label} (exit ${result.status})`);
    if (!pass) failed = true;
  }
  if (ui) {
    const shots = await screenshots(path.join(cwd, '.e2e'));
    const latest = shots.find(f => f.endsWith('001-local-effect-greeting.png'));
    if (!latest) throw new Error(`Missing real UI screenshot for ${name}`);
    await copyFile(latest, path.join(receipts, `${name}.png`));
    await copyFile(path.join(cwd, '.e2e/report.json'), path.join(receipts, `${name}-ui-report.json`));
  }
  summary.samples[name] = { preset: resolved.preset, versions: Object.fromEntries(Object.entries(resolved.packages).map(([name, meta]) => [name, meta.version])), lockedPackages: Object.keys(lock.packages).length - 1, lockVerified: true, checks };
}
summary.passed = !failed;
await writeFile(path.join(receipts, 'verification.json'), JSON.stringify(summary, null, 2) + '\n');
if (failed) process.exitCode = 1;
