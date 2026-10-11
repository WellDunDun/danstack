import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.CONVEX_DEPLOYMENT && !process.env.CONVEX_SELF_HOSTED_URL) {
  console.error('BACKEND_PREREQUISITE: No existing Convex deployment is configured. Codegen was not started. Run npm run backend:setup only when you intend authentication/provisioning, then retry.');
  process.exitCode = 2;
} else {
  const child = spawn(process.execPath, ['node_modules/convex/bin/main.js', 'codegen'], { stdio: 'inherit' });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
