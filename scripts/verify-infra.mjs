import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const samples=path.join(root,'samples'); const receipts=path.join(root,'receipts');
const cases=[['effect-bazel','convex-effect',true,false],['effect-bazel-ui','convex-effect',true,true],['confect-bazel','convex-confect',true,false],['confect-bazel-ui','convex-confect',true,true],['alchemy-demo','cloudflare-alchemy',false,false],['alchemy-ui','cloudflare-alchemy',false,true],['alchemy-bazel','cloudflare-alchemy',true,false],['alchemy-bazel-ui','cloudflare-alchemy',true,true]];
await mkdir(samples,{recursive:true}); const results=[]; let failed=false;
const selected=process.argv.slice(2); const subset=selected.length?cases.filter(c=>selected.includes(c[0])):cases;
function run(name,label,cmd,args,cwd,expected=0){ const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:300000,maxBuffer:16000000,env:{...process.env,DO_NOT_TRACK:'1',ALCHEMY_TELEMETRY_DISABLED:'1',E2E_TELEMETRY_DISABLED:'1'}}); const receipt=`${name}-${label}.txt`; writeFile(path.join(receipts,receipt),(r.stdout??'')+(r.stderr??'')+(r.error?`\n${r.error.message}`:'')); const passed=r.status===expected; console.log(`${passed?'PASS':'FAIL'} ${name} ${label} (${r.status})`); if(!passed)failed=true; return {label,command:[cmd,...args],exit:r.status,expected,passed,receipt}; }
for(const [name,preset,bazel,e2e] of subset){ const cwd=path.join(samples,name);const checks=[];
 if(!process.env.VERIFY_EXISTING && !process.env.BAZEL_ONLY){const options=[...(bazel?['--bazel']:[]),...(e2e?['--e2e']:[]),...(preset==='cloudflare-alchemy'?['--alchemy-channel','beta']:[])];checks.push(run(name,'generate',process.execPath,[path.join(root,'src/cli.mjs'),'create',name,'--preset',preset,...options,'--json'],samples)); if(!checks.at(-1).passed)continue;checks.push(run(name,'install',process.execPath,[path.join(root,'src/cli.mjs'),'install',name,'--json'],samples));if(!checks.at(-1).passed)continue;}
 if(process.env.VERIFY_EXISTING && !process.env.BAZEL_ONLY){ checks.push(run(name,'install',process.execPath,[path.join(root,'src/cli.mjs'),'install',name,'--json'],samples));if(!checks.at(-1).passed)continue; }
 const commands=[...(preset==='convex-confect'?[['codegen',['run','codegen:local']]]:[]),['typecheck',['run','typecheck']],['unit',['test']],['build',['run','build']],...(preset==='cloudflare-alchemy'?[['local-plan',['run','local:plan']],['local-worker-kv',['run','test:local']]]:[['backend-prerequisite',['run','backend:codegen'],2]]),['tree',['ls','--all','--json']],...(bazel?[['bazel-setup',['run','bazel:setup']],['bazel-build',['run','bazel:build']],['bazel-test',['run','bazel:test']]]:[])];
 for(const [label,args,expected=0] of commands){if(process.env.BAZEL_ONLY&&!label.startsWith('bazel'))continue;if(label==='bazel-setup')await rm(path.join(cwd,'node_modules'),{recursive:true,force:true});checks.push(run(name,label,'npm',args,cwd,expected));}
 if(bazel && checks.filter(c=>c.label.startsWith('bazel')).every(c=>c.passed)){
   checks.push(run(name,'bazel-incremental','npm',['run','bazel:build'],cwd));
   const domain=path.join(cwd,'src/domain.ts'); const original=await readFile(domain,'utf8');
   const bundleHash=async()=>{ const files=await readdir(path.join(cwd,'bazel-bin/bundle/assets'));return createHash('sha256').update((await Promise.all(files.sort().map(f=>readFile(path.join(cwd,'bazel-bin/bundle/assets',f))))).reduce((a,b)=>Buffer.concat([a,b]),Buffer.alloc(0))).digest('hex'); };
   const before=await bundleHash();
   try{await writeFile(domain,original.replace('Hello,','Cache-proof,'));checks.push(run(name,'bazel-source-invalidation','npm',['run','bazel:build'],cwd));const after=await bundleHash();checks.push({label:'source-output-hash',before,after,passed:before!==after});if(before===after)failed=true;}finally{await writeFile(domain,original);}
   checks.push(run(name,'bazel-restored-build','npm',['run','bazel:build'],cwd));
   checks.push(run(name,'bazel-restored-test','npm',['run','bazel:test'],cwd));
   if(e2e){ const uiFile=path.join(cwd,'tests/demo.e2e.ts');const authored=await readFile(uiFile,'utf8');try{await writeFile(uiFile,authored+'\nconst declaredInputProof: number = \"must fail typecheck\";\n');checks.push(run(name,'bazel-ui-type-error-proof','npm',['run','bazel:test'],cwd,3));}finally{await writeFile(uiFile,authored);}checks.push(run(name,'bazel-ui-restored-test','npm',['run','bazel:test'],cwd)); }
 }

 const resolution=JSON.parse(await readFile(path.join(cwd,'fresh-stack.json'),'utf8'));results.push({name,preset,bazel,e2e,snapshotReplay:resolution.snapshotReplay??null,versions:Object.fromEntries(Object.entries(resolution.packages).map(([n,m])=>[n,m.version])),buildTools:resolution.buildTools,checks});await writeFile(path.join(receipts,`infra-${name}.json`),JSON.stringify(results.at(-1),null,2)+'\n');
 if(bazel)run(name,'bazel-shutdown',path.join(cwd,'.bazel-tools/bazel'),['--nosystem_rc','--nohome_rc',`--output_user_root=${path.join(cwd,'.bazel-cache')}`,'shutdown','--repo_contents_cache='],cwd);
 if(bazel)spawnSync('chmod',['-R','u+w',path.join(cwd,'.bazel-cache')]);
 for(const directory of ['node_modules','.bazel-cache','.bazel-tools','.alchemy-local'])await rm(path.join(cwd,directory),{recursive:true,force:true});

}
await writeFile(path.join(receipts,'infra-verification.json'),JSON.stringify({verifiedAt:new Date().toISOString(),passed:!failed,results},null,2)+'\n'); if(failed)process.exitCode=1;
