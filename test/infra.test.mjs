import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, alchemyPrereleases } from '../src/resolve.mjs';
import { verifyLock, verifyPnpm } from '../src/install.mjs';
import { parse } from '../src/cli.mjs';
import { fixture, config, read, scaffold } from './fixtures.mjs';
import { buildFiles } from '../src/generate.mjs';
function alchemyFixture() {
 const f = fixture();
 for (const [name, version, extra] of [['alchemy','2.0.0-beta.81',{peerDependencies:{effect:'^4.0.0'},dependencies:{...alchemyPrereleases}}],['@alchemy.run/cloudflare-runtime','2.0.0-beta.81',{peerDependencies:{effect:'^4.0.2','@distilled.cloud/cloudflare':'1.0.0-rc.13'}}],['@distilled.cloud/cloudflare','1.0.0-rc.13',{peerDependencies:{effect:'^4.0.2'}}],['@effect/platform-node-shared','4.0.2',{peerDependencies:{effect:'^4.0.2'}}],['@effect/sql-d1','4.0.2',{peerDependencies:{effect:'^4.0.2'}}],['@effect/sql-sqlite-do','4.0.2',{peerDependencies:{effect:'^4.0.2'}}],['redis','6.3.0',{}],['@effect/platform-node','4.0.2',{peerDependencies:{effect:'^4.0.2',redis:'>=5 <7'}}]]) f[name] = {versions:{[version]:{name,version,...extra,dist:{tarball:`https://registry.npmjs.org/${name}/a.tgz`,integrity:'sha512-fixture'}}}};
 return f;
}
test('Alchemy beta is explicitly selected and other packages remain stable', async () => {
 const f=alchemyFixture();
 await assert.rejects(resolve({...config,preset:'cloudflare-alchemy',read:read(f)}),e=>e.code==='CHANNEL');
 f.effect.versions['5.0.0-beta.3']={...f.effect.versions['4.0.2'],version:'5.0.0-beta.3'};
 const r=await resolve({...config,preset:'cloudflare-alchemy',alchemyChannel:'beta',read:read(f)});
 assert.equal(r.packages.alchemy.version,'2.0.0-beta.81');assert.equal(r.packages.effect.version,'4.0.2');
 const files=await buildFiles('demo',r,scaffold);
 assert.ok(files['infra/runtime.ts'].includes("Containers are outside"));
 assert.ok(files['.gitignore'].includes('.alchemy-local/'));
 assert.equal(files['convex.json'],undefined);
 f.alchemy.versions['2.0.0-beta.82']={...f.alchemy.versions['2.0.0-beta.81'],version:'2.0.0-beta.82'};
 await assert.rejects(resolve({...config,preset:'cloudflare-alchemy',alchemyChannel:'beta',read:read(f)}),e=>e.code==='ADAPTER');
 await assert.rejects(resolve({...config,alchemyChannel:'beta',read:read(f)}),e=>e.code==='CHANNEL');
});
test('new CLI options do not relax argument validation',()=>{
 assert.equal(parse(['create','demo','--bazel']).bazel,true);
 assert.equal(parse(['create','demo','--preset','cloudflare-alchemy','--alchemy-channel','beta']).alchemyChannel,'beta');
 for(const args of [['create','demo','--alchemy-channel'],['create','demo','--alchemy-channel','next'],['install','demo','--bazel'],['create','demo','--bazel','--bazel']]) assert.throws(()=>parse(args));
});
const manifest={dependencies:{effect:'4.0.2'},devDependencies:{}};
const original={version:'4.0.2',integrity:'sha512-original',resolved:'https://registry.npmjs.org/effect/-/effect-4.0.2.tgz'};
const lock=()=>({lockfileVersion:3,packages:{'':manifest,'node_modules/effect':{...original}}});
test('root archive matches live generation metadata',()=>{
 const r={packages:{effect:{version:original.version,integrity:original.integrity,tarball:original.resolved}}};
 verifyLock(lock(),manifest,r);
 for(const edit of [{integrity:'sha512-other'},{resolved:'https://registry.npmjs.org/other/a.tgz'}]) {
 const l=lock();Object.assign(l.packages['node_modules/effect'],edit);assert.throws(()=>verifyLock(l,manifest,r),e=>e.code==='LOCK');
 }
});
test('Alchemy exception is limited to reviewed names and versions',()=>{
 for(const [name,version,passes]of [['alchemy','2.0.0-beta.81',true],['alchemy','2.0.0-beta.82',false],['unrelated','2.0.0-beta.81',false],['@distilled.cloud/core','1.0.0-rc.13',true],['@distilled.cloud/core','1.0.0-rc.14',false]]){
 const l={lockfileVersion:3,packages:{'':{dependencies:{},devDependencies:{}},['node_modules/'+name]:{...original,version}}};
 const fn=()=>verifyLock(l,l.packages[''],{preset:'cloudflare-alchemy',alchemyChannel:'beta'});
 if(passes)assert.doesNotThrow(fn);else assert.throws(fn,e=>e.code==='LOCK');
 }
});
test('pnpm import must preserve exact versions, archives and package set',()=>{
 const yaml=`lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      effect: {specifier: 4.0.2, version: 4.0.2}\npackages:\n  effect@4.0.2:\n    resolution: {integrity: sha512-original}\nsnapshots:\n  effect@4.0.2: {}\n`;
 verifyPnpm(yaml,lock(),manifest);
 for(const changed of [yaml.replace('sha512-original','sha512-other'),yaml.replaceAll('4.0.2','4.0.1'),yaml.replace('integrity: sha512-original','integrity: sha512-original, tarball: https://evil.test/a')])assert.throws(()=>verifyPnpm(changed,lock(),manifest),e=>e.code==='LOCK');
});

test('Bazel translation rejects duplicate archive identities and preserves dependency edges',async()=>{
 const {npmToBazelLock}=await import('../src/npm-bazel-lock.mjs');
 const base={lockfileVersion:3,packages:{'':{dependencies:{a:'1.0.0'}},'node_modules/a':{...original,version:'1.0.0',dependencies:{c:'1.0.0'}},'node_modules/c':{...original,version:'1.0.0'},'node_modules/a/node_modules/c':{...original,version:'1.0.0',integrity:'sha512-other'}}};
 assert.throws(()=>npmToBazelLock(base,base.packages['']),e=>e.code==='BAZEL_LOCK');
 delete base.packages['node_modules/a/node_modules/c'];const source=npmToBazelLock(base,base.packages['']);verifyPnpm(source,base,base.packages['']);
 assert.throws(()=>verifyPnpm(source.replace('c: 1.0.0','c: 9.0.0'),base,base.packages['']),e=>e.code==='LOCK');
});

test('Bazel vendor resolution selects latest stable unyanked versions and checks adapters/engines',async()=>{
 const {resolveBazel}=await import('../src/bazel.mjs');
 let latest='9.3.0';let rules='3.5.1';
 const get=async url=>{
 if(url.includes('api.github'))return{tag_name:latest,prerelease:false,draft:false,assets:['darwin-arm64','darwin-x86_64','linux-arm64','linux-x86_64'].flatMap(p=>[{name:`bazel-${latest}-${p}`,digest:'sha256:'+'a'.repeat(64),browser_download_url:`https://github.com/bazelbuild/bazel/releases/download/${latest}/bazel-${latest}-${p}`},{name:`bazel-${latest}-${p}.sha256`}])};
 if(url.endsWith('index.json'))return[{version:'v27.0.0-rc.1'},{version:'v26.11.1'},{version:'v26.0.0'}];
 if(url.endsWith('metadata.json'))return{versions:url.includes('aspect_rules_js')?['3.5.0',rules,'4.0.0','5.0.0-beta.1']:['6.7.6'],yanked_versions:{'4.0.0':'bad'}};
 return{integrity:'sha256-fixture'};
 };
 const getText=async url=>url.endsWith('MODULE.bazel')?'module(bazel_compatibility = [">=7.6.0"])':'a'.repeat(64)+'  node-v26.11.1-darwin-arm64.tar.gz\n';
 const r=await resolveBazel({effect:{version:'4.0.2',engines:{node:'>=24'}}},{get,getText});assert.equal(r.aspect_rules_js.version,'3.5.1');assert.equal(r.node.version,'26.11.1');
 latest='10.0.0';await assert.rejects(resolveBazel({}, {get,getText}),e=>e.code==='BAZEL_ADAPTER');latest='9.3.0';rules='3.6.0';await assert.rejects(resolveBazel({}, {get,getText}),e=>e.code==='BAZEL_ADAPTER');rules='3.5.1';await assert.rejects(resolveBazel({x:{version:'1.0.0',engines:{node:'<26'}}},{get,getText}),e=>e.code==='ENGINE');
 await assert.rejects(resolveBazel({}, {get:async()=>{throw new Error('offline')},getText}),/offline/);
});

test('Bazel typecheck inputs include all authored test files, including optional UI tests', async()=>{
 const {bazelFiles}=await import('../src/bazel.mjs');
 const r={preset:'convex-confect',buildTools:{bazel:{version:'9.3.0'},aspect_rules_js:{version:'3.5.1'},rules_nodejs:{version:'6.7.6'},node:{version:'26.11.1',sha256Manifest:''}}};
 const files=bazelFiles(r);assert.ok(files['BUILD.bazel'].includes('tests/**/*.ts'));assert.ok(files['BUILD.bazel'].includes('e2e.config.ts'));assert.ok(files['BUILD.bazel'].includes('mnemonic = "ConfectCodegen"'));assert.ok(files['MODULE.bazel'].includes('lifecycle_hooks = {}'));
});

test('Bazel install dry-run refuses linked or unowned translated locks before npm',async t=>{
 const {mkdtemp,writeFile,symlink,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const path=await import('node:path');const {installPlan}=await import('../src/install.mjs');
 const target=await mkdtemp(path.join(tmpdir(),'fresh-bazel-lock-'));t.after(()=>rm(target,{recursive:true,force:true}));
 const resolution=await resolve({...config,bazel:true,read:read(fixture())});
 const manifest={name:'demo',private:true,type:'module',dependencies:Object.fromEntries(resolution.groups.dependencies.map(n=>[n,resolution.packages[n].version])),devDependencies:Object.fromEntries(resolution.groups.devDependencies.map(n=>[n,resolution.packages[n].version]))};
 await writeFile(path.join(target,'fresh-stack.json'),JSON.stringify(resolution));await writeFile(path.join(target,'package.json'),JSON.stringify(manifest));
 await symlink(path.join(target,'package.json'),path.join(target,'pnpm-lock.yaml'));await assert.rejects(installPlan(target,config),e=>e.code==='PATH');await rm(path.join(target,'pnpm-lock.yaml'));await writeFile(path.join(target,'pnpm-lock.yaml'),'unowned');await assert.rejects(installPlan(target,config),e=>e.code==='LOCK');
});

test('newly published platform release selects newest compatible stable with disclosed peer reason',async()=>{
 const f=alchemyFixture();const prior=f['@effect/platform-node'].versions['4.0.2'];f['@effect/platform-node'].versions['4.0.3']={...prior,version:'4.0.3',peerDependencies:{...prior.peerDependencies,effect:'^4.0.3'}};
 f['@effect/platform-node']['dist-tags']={latest:'4.0.3'};const result=await resolve({...config,preset:'cloudflare-alchemy',alchemyChannel:'beta',read:read(f)});assert.equal(result.packages['@effect/platform-node'].version,'4.0.2');const choice=result.selections.find(s=>s.name==='@effect/platform-node');assert.equal(choice.distTagLatest,'4.0.3');assert.ok(choice.reasons.some(r=>r.peer==='effect'&&r.range==='^4.0.3')); 
});

test('compatible solver handles supporting dependency peers and their declared ranges',async()=>{
 const f=alchemyFixture();for(const n of ['@effect/platform-node','@effect/platform-node-shared','@effect/sql-d1','@effect/sql-sqlite-do']){const old=f[n].versions['4.0.2'];f[n].versions['4.0.3']={...old,version:'4.0.3',peerDependencies:{...old.peerDependencies,effect:'^4.0.3'}};f[n]['dist-tags']={latest:'4.0.3'};}
 Object.assign(f.alchemy.versions['2.0.0-beta.81'].dependencies,{'@effect/sql-d1':'^4.0.0','@effect/sql-sqlite-do':'^4.0.0'});
 f['@effect/platform-node'].versions['4.0.2'].dependencies={'@effect/platform-node-shared':'^4.0.2'};f['@effect/platform-node'].versions['4.0.3'].dependencies={'@effect/platform-node-shared':'^4.0.3'};
 const r=await resolve({...config,preset:'cloudflare-alchemy',alchemyChannel:'beta',read:read(f)});assert.equal(r.packages['@effect/platform-node-shared'].version,'4.0.2');const choices=r.selections.filter(s=>s.selected==='4.0.2'&&s.latestEligible==='4.0.3');assert.equal(choices.length,4);assert.ok(choices.every(s=>s.reasons.some(p=>p.peer==='effect'&&p.range==='^4.0.3')));
 delete f['@effect/platform-node'].versions['4.0.2'];await assert.rejects(resolve({...config,preset:'cloudflare-alchemy',alchemyChannel:'beta',read:read(f)}),e=>e.code==='PEER'&&e.details.peer==='effect');
});
test('compatible solver backtracks cross-package constraints with deterministic newest-first priority',async()=>{
 const f=fixture();f.effect.versions['4.0.3']={...f.effect.versions['4.0.2'],version:'4.0.3'};f.convex.versions['1.47.0']={...f.convex.versions['1.46.0'],version:'1.47.0',peerDependencies:{effect:'4.0.2'}};f.convex['dist-tags']={latest:'1.47.0'};f.effect['dist-tags']={latest:'4.0.3'};
 const r=await resolve({...config,read:read(f)});assert.equal(r.packages.convex.version,'1.47.0');assert.equal(r.packages.effect.version,'4.0.2');const c=r.selections.find(c=>c.name==='effect');assert.ok(c.reasons.some(p=>p.name==='convex'&&p.range==='4.0.2'));assert.equal(r.selectionOrder[0],'convex');
});
test('engines may select a disclosed compatible release but malformed metadata cannot be hidden',async()=>{
 const f=fixture();f.convex.versions['1.47.0']={...f.convex.versions['1.46.0'],version:'1.47.0',engines:{node:'>=26'}};f.convex['dist-tags']={latest:'1.47.0'};
 const r=await resolve({...config,read:read(f)});assert.equal(r.packages.convex.version,'1.46.0');assert.equal(r.selections[0].reasons[0].kind,'engine');
 for(const range of [null,42,'bad-range','']){const bad=fixture();bad.convex.versions['1.46.0'].peerDependencies={effect:range};await assert.rejects(resolve({...config,read:read(bad)}),e=>e.code==='PEER');}
 const missing=fixture();missing.convex.versions['1.46.0'].peerDependencies={unknown:'^1'};await assert.rejects(resolve({...config,read:read(missing)}),e=>e.code==='ADAPTER');
 const malformed=fixture();malformed.convex.versions['1.46.0'].engines={node:'wrong'};await assert.rejects(resolve({...config,read:read(malformed)}),e=>e.code==='ENGINE');
});
