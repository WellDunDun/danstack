// Integration proof from an explicitly disclosed earlier live snapshot.
// Production CLI never imports this file and never falls back to it.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildFiles,writeProject} from '../src/generate.mjs';
import {registryReader,requirements} from '../src/resolve.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const prior=process.argv[2]??path.join(root,'test/fixtures/alchemy-live-snapshot');
const old=JSON.parse(await readFile(path.join(prior,'fresh-stack.json')));
const oldLock=JSON.parse(await readFile(path.join(prior,'package-lock.json')));
const read=registryReader();
const additions={};
for(const [name,version]of [['@alchemy.run/cloudflare-runtime','2.0.0-beta.81'],['@distilled.cloud/cloudflare','1.0.0-rc.13']]){
 const p=await read(name);const m=p.versions[version];if(!m||oldLock.packages['node_modules/'+name]?.integrity!==m.dist.integrity)throw new Error('Historical archive mismatch');
 additions[name]={version,integrity:m.dist.integrity,tarball:m.dist.tarball,engines:m.engines??{},peers:m.peerDependencies??{},optionalPeers:Object.keys(m.peerDependenciesMeta??{}).filter(n=>m.peerDependenciesMeta[n].optional)};
}
const uiBase=JSON.parse(await readFile(path.join(root,'samples/effect-demo/fresh-stack.json')));
const bazelBase=JSON.parse(await readFile(path.join(root,'samples/effect-bazel/fresh-stack.json')));
await mkdir(path.join(root,'samples'),{recursive:true});
for(const [name,bazel,e2e]of [['alchemy-demo',false,false],['alchemy-ui',false,true],['alchemy-bazel',true,false],['alchemy-bazel-ui',true,true]]){
 const resolution={...old,bazel,e2e,groups:requirements(old.preset,e2e,bazel),packages:{...old.packages,...additions,...(e2e?Object.fromEntries(['e2e','@e2e-dev/web'].map(n=>[n,uiBase.packages[n]])): {})},...(bazel?{buildTools:bazelBase.buildTools}:{}),snapshotReplay:{priorObservedAt:old.resolvedAt,replayedAt:new Date().toISOString(),reason:'Latest platform-node 4.0.3 requires absent stable Effect 4.0.3. Explicit historical integration proof; production CLI has no fallback.',runtimePeers:'Same exact archives already present in prior locked graph; now declared direct.'}};
 await writeProject(path.join(root,'samples',name),await buildFiles(name,resolution));
 await writeFile(path.join(root,'samples',name,'README.md'),(await readFile(path.join(root,'samples',name,'README.md'),'utf8'))+'\n## Historical integration fixture\n\nThis sample explicitly replays the earlier live coherent Effect/platform-node 4.0.2 snapshot. Current live generation rejects the observed platform-node 4.0.3 / Effect 4.0.2 peer conflict. Production has no downgrade or snapshot fallback. Runtime and mandatory Cloudflare RC peer use the same verified archives already locked in the prior sample. See snapshotReplay in fresh-stack.json.\n');
 console.log(`Historical fixture created: ${name}`);
}
await writeFile(path.join(root,'receipts/alchemy-snapshot-replay.json'),JSON.stringify({priorObservedAt:old.resolvedAt,replayedAt:new Date().toISOString(),versions:Object.fromEntries(Object.entries({...old.packages,...additions}).map(([n,m])=>[n,m.version])),productionFallback:false},null,2)+'\n');
