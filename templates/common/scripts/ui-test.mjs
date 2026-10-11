import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['node_modules/e2e/dist/cli/bin.js', 'run'], {
  stdio: 'inherit', env: { ...process.env, E2E_TELEMETRY_DISABLED: '1' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
