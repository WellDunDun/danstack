import { cp, mkdir, symlink, rm, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const source = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(source, 'generated');
await mkdir(output, { recursive: true });
for (const name of ['package.json', 'tsconfig.json', 'index.html', 'convex.json', 'src', 'tests', 'confect']) {
  await cp(path.join(source, name), path.join(output, name), { recursive: true, dereference: true, filter: src => !src.includes('/_generated/') && !src.endsWith('/_generated') });
}
try { await cp(path.join(source, 'e2e.config.ts'), path.join(output, 'e2e.config.ts'), { dereference: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(path.join(output, 'convex'), { recursive: true });
const modules = path.join(output, 'node_modules');
await symlink(path.join(source, 'node_modules'), modules, 'dir');
try {
 const result = spawnSync(process.execPath, [path.join(source, 'node_modules/@confect/cli/bin/confect.mjs'), 'codegen'], { cwd: output, stdio: 'inherit' });
 if (result.status !== 0) throw result.error ?? new Error(`Confect codegen exited ${result.status}`);
} finally { await rm(modules); }
