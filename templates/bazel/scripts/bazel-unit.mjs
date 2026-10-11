import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', root + '/generated/tests/unit.test.ts'], { cwd: root, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
