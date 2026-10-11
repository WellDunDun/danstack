import {spawnSync} from 'node:child_process';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));const cwd=path.join(root,'samples','effect-bazel-ui');const checks=[];
function run(label,command,args,expected=0){const r=spawnSync(command,args,{cwd:label==='install'?path.join(root,'samples'):cwd,encoding:'utf8',timeout:300000,maxBuffer:16000000});const receipt=`ui-input-${label}.txt`;writeFile(path.join(root,'receipts',receipt),(r.stdout??'')+(r.stderr??''));const c={label,command:[command,...args],exit:r.status,expected,passed:r.status===expected,receipt};checks.push(c);console.log(`${c.passed?'PASS':'FAIL'} ${label}`);return c.passed;}
if(!run('install',process.execPath,[path.join(root,'src/cli.mjs'),'install','effect-bazel-ui'],0))process.exit(1);
run('setup','npm',['run','bazel:setup']);run('baseline','npm',['run','bazel:test']);
const file=path.join(cwd,'tests/demo.e2e.ts');const original=await readFile(file,'utf8');try{await writeFile(file,original+'\nconst declaredInputProof: number = "must fail typecheck";\n');run('negative','npm',['run','bazel:test'],3);}finally{await writeFile(file,original);}
run('restored','npm',['run','bazel:test']);
await writeFile(path.join(root,'receipts/ui-input-verification.json'),JSON.stringify({passed:checks.every(c=>c.passed),checks},null,2)+'\n');
run('shutdown',path.join(cwd,'.bazel-tools/bazel'),['--nosystem_rc','--nohome_rc',`--output_user_root=${path.join(cwd,'.bazel-cache')}`,'shutdown','--repo_contents_cache=']);spawnSync('chmod',['-R','u+w',path.join(cwd,'.bazel-cache')]);for(const name of ['node_modules','.bazel-cache','.bazel-tools'])await rm(path.join(cwd,name),{force:true,recursive:true});
if(checks.some(c=>!c.passed))process.exitCode=1;
