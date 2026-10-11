import { spawn } from 'node:child_process';
import { mkdtemp, lstat } from 'node:fs/promises';
import path from 'node:path';
const mode = process.argv[2];
if (!['dev', 'plan', 'test'].includes(mode) || process.argv.length !== 3) throw new Error('Usage: local.mjs dev|plan|test (no stage or provider overrides)');
// A fresh workspace per session prevents imported cloud state and stale real IDs.
try { const st = await lstat('.alchemy-local'); if (!st.isDirectory() || st.isSymbolicLink()) throw new Error('Unsafe .alchemy-local'); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
const { mkdir } = await import('node:fs/promises');
await mkdir('.alchemy-local', { recursive: true });
const state = await mkdtemp(path.resolve('.alchemy-local/session-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(ALCHEMY_|CLOUDFLARE_|CF_|AWS_|GOOGLE_|AZURE_|EFFECT_)/i.test(k)));
Object.assign(env, { CI: 'true', CLOUDFLARE_ACCOUNT_ID: '00000000000000000000000000000000', ALCHEMY_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1', XDG_DATA_HOME: path.join(state, 'xdg-data'), XDG_STATE_HOME: path.join(state, 'xdg-state'), XDG_CACHE_HOME: path.join(state, 'xdg-cache'), XDG_CONFIG_HOME: path.join(state, 'xdg-config'), ALCHEMY_HOME: path.join(state, 'isolated-home'), FRESH_LOCAL_STATE: state });
const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/local-run.ts', mode], { env, stdio: 'inherit', shell: false });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
child.on('error', error => { console.error(error); process.exitCode = 1; });
