import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir=fileURLToPath(new URL('../receipts/',import.meta.url));
const files=(await readdir(dir)).filter(n=>/^infra-(effect|confect|alchemy).*\.json$/.test(n));
const results=await Promise.all(files.sort().map(async f=>JSON.parse(await readFile(dir+f,'utf8'))));
await writeFile(dir+'infra-verification.json',JSON.stringify({verifiedAt:new Date().toISOString(),passed:results.length===8&&results.every(r=>r.checks.every(c=>c.passed)),results},null,2)+'\n');
console.log(results.map(r=>`${r.name}: ${r.checks.every(c=>c.passed)?'PASS':'FAIL'}`).join('\n'));
