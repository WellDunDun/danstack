import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {authTemplate,templateFiles,templatePrefix} from '../src/tanstack-upstream.mjs';
import {buildTanstack} from '../src/tanstack.mjs';
import {resolve,requirements} from '../src/resolve.mjs';
import {verifyLock} from '../src/install.mjs';
import {parse} from '../src/cli.mjs';
import {shadcnComponents} from '../src/shadcn.mjs';
const original=JSON.parse(await readFile(new URL('./fixtures/tanstack-upstream.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('./fixtures/tanstack-registry.json',import.meta.url),'utf8'));
const uiRegistry=JSON.parse(await readFile(new URL('./fixtures/shadcn-registry.json',import.meta.url),'utf8'));
const ui = (items=structuredClone(uiRegistry)) => () => shadcnComponents({getText:async url=>JSON.stringify(items[url.split('/').at(-1).replace('.json','')])});
function reader(files=structuredClone(original),edit=()=>{}){
 const tree={sha:'b'.repeat(40),truncated:false,tree:templateFiles.map(n=>({path:templatePrefix+n,type:'blob',mode:'100644',sha:createHash('sha1').update(`blob ${Buffer.byteLength(files[n])}\0`).update(files[n]).digest('hex')}))};edit(tree);
 return {getJson:async u=>u.endsWith('/commits/main')?{sha:'a'.repeat(40),commit:{tree:{sha:'b'.repeat(40)}}}:tree,getText:async u=>files[u.split(templatePrefix)[1]]};
}
const config={preset:'tanstack-convex-workos',tanstackRuntime:'rc',e2e:true,node:'25.8.1',npm:'11.11.0',read:async n=>structuredClone(registry[n])};
test('official auth scaffold uses verified blobs and rejects unsafe/drifting source',async()=>{
 const r=await authTemplate(reader());assert.equal(r.receipt.commit,'a'.repeat(40));assert.ok(r.files['src/router.tsx'].includes('InnerWrap'));
 await assert.rejects(authTemplate(reader(undefined,t=>t.tree[0].sha='c'.repeat(40))),e=>e.code==='INTEGRITY');
 await assert.rejects(authTemplate(reader(undefined,t=>t.tree[0].mode='120000')),e=>e.code==='ADAPTER');
 await assert.rejects(authTemplate(reader(undefined,t=>t.tree.push({...t.tree[0],path:templatePrefix+'src/routes/new-api.ts'}))),e=>e.code==='ADAPTER');
 await assert.rejects(authTemplate(reader(undefined,t=>t.truncated=true)),e=>e.code==='SCAFFOLD');
 const drift=structuredClone(original);drift['src/start.ts']='export const obsolete = true';await assert.rejects(authTemplate(reader(drift)),e=>e.code==='ADAPTER');
 const changed=structuredClone(original);const pkg=JSON.parse(changed['package.json']);pkg.dependencies.newProvider='^1';changed['package.json']=JSON.stringify(pkg);await assert.rejects(authTemplate(reader(changed)),e=>e.code==='ADAPTER');
});
test('auth preset resolves newest compatible WorkOS peer and records below-latest reason',async()=>{
 const r=await resolve(config);assert.equal(r.packages['@workos-inc/node'].version,'10.14.0');const c=r.selections.find(c=>c.name==='@workos-inc/node');assert.equal(c.latestEligible,'11.0.0');assert.ok(c.reasons.some(p=>p.name==='@workos/authkit-tanstack-react-start'&&p.range==='^10.7.0'));
 const newer=structuredClone(registry);newer['@tanstack/react-start'].versions['1.169.0']={...newer['@tanstack/react-start'].versions['1.168.61'],version:'1.169.0'};await assert.rejects(resolve({...config,read:async n=>newer[n]}),e=>e.code==='ADAPTER');
});
test('auth preset has explicit runtime selection and rejects unreviewed combinations before reads',async()=>{
 await assert.rejects(resolve({...config,tanstackRuntime:undefined,read:async()=>{throw Error('read must not run')}}),e=>e.code==='CHANNEL');
 await assert.rejects(resolve({...config,bazel:true,read:async()=>{throw Error('read must not run')}}),e=>e.code==='COMBINATION');
 assert.throws(()=>requirements('tanstack-convex-workos',true,true),e=>e.code==='COMBINATION');
 assert.equal(parse(['create','demo','--preset','tanstack-convex-workos','--tanstack-runtime','rc']).tanstackRuntime,'rc');
 for(const a of [['create','demo','--tanstack-runtime','beta'],['install','demo','--tanstack-runtime','rc'],['create','demo','--effect'],['create','demo','--confect']])assert.throws(()=>parse(a),e=>e.code==='ARGUMENT');
});
test('auth generation leaves account/setup/install explicit and no fake generated sources',async()=>{
 const r=await resolve(config);const files=await buildTanstack('demo',r,()=>authTemplate(reader()),ui());
 const p=JSON.parse(files['package.json']);assert.equal(p.scripts.dev,'vite --host 127.0.0.1');assert.equal(p.scripts['backend:setup'],'convex dev');assert.ok(p.scripts.typecheck.startsWith('tsr generate'));
 assert.equal(files['.env.local'],undefined);assert.equal(files['src/routeTree.gen.ts'],undefined);assert.equal(files['convex/_generated/server.js'],undefined);
 assert.deepEqual(JSON.parse(files['convex.json']),{functions:'convex/'});
 assert.ok(files['src/start.ts'].indexOf('requestMiddleware: [csrf,')>=0);assert.ok(files['src/lib/auth-routes.server.ts'].includes("returnPathname: '/authenticated'"));
 assert.ok(files['src/lib/session.ts'].includes('applyServerAuth(client?.serverHttpClient, auth)'));
  const modified=structuredClone(original);modified['vite.config.ts']+='\nglobalThis.__unreviewedRemoteCode = true;';modified['src/vite-env.d.ts']+='\nimport "unreviewed-executable";';
  const safe=await buildTanstack('demo',r,()=>authTemplate(reader(modified)),ui());
  assert.ok(!safe['vite.config.ts'].includes('__unreviewedRemoteCode'));assert.ok(!safe['src/vite-env.d.ts'].includes('unreviewed-executable'));
  assert.ok(safe['vite.config.ts'].includes('strictPort: true'));assert.ok(safe['.env.example'].includes('http://127.0.0.1:3000/api/auth/callback'));
});
test('shadcn current registry data rejects executable drift and unsafe mutation surfaces',async()=>{
 const r=await ui()();assert.equal(r.receipt.style,'base-nova');assert.ok(r.files['src/components/ui/button.tsx'].includes('@base-ui/react/button'));
 for(const change of [j=>j.button.files[0].content+='\nfetch("https://evil.invalid")',j=>j.button.files[0].target='../unsafe',j=>j.button.files.push(j.button.files[0]),j=>j.button.envVars={SECRET:'unsafe'},j=>j.button.registryDependencies=['https://evil.invalid/a.json'],j=>j.button.dependencies.push('new-package'),j=>j.button.css={body:{display:'none'}}]){const j=structuredClone(uiRegistry);change(j);await assert.rejects(ui(j)(),e=>e.code==='ADAPTER');}
 await assert.rejects(shadcnComponents({getText:async()=>'{bad'}),e=>e.code==='REGISTRY');
});
test('shadcn is complete and scoped to the React preset without affecting auth safety',async()=>{
 const r=await resolve(config),files=await buildTanstack('demo',r,()=>authTemplate(reader()),ui());
 const components=JSON.parse(files['components.json']);assert.equal(components.style,'base-nova');assert.equal(components.rsc,false);assert.equal(components.tailwind.css,'src/app.css');assert.equal(components.aliases.utils,'@/lib/utils');
 assert.equal(files['src/lib/utils.ts'],"export { cn } from 'cn';\n");
 for(const name of ['button','card','input'])assert.ok(files[`src/components/ui/${name}.tsx`]);
 assert.ok(files['vite.config.ts'].includes('tailwindcss()'));assert.ok(files['src/app.css'].includes('@import "shadcn/tailwind.css"'));
 assert.ok(files['src/components/AuthPanel.tsx'].includes('Scaffolding is complete.'));assert.ok(files['src/components/AuthPanel.tsx'].includes('<a className={buttonVariants'));assert.ok(!files['src/components/AuthPanel.tsx'].includes('render={<a'));
 assert.ok(r.ui.components.every(c=>c.sha256.length===64));
 for(const preset of ['convex-effect','convex-confect','cloudflare-alchemy'])assert.ok(!Object.values(requirements(preset,true)).flat().includes('shadcn'));
 const drift=structuredClone(registry);const n='@tailwindcss/vite';drift[n].versions['5.0.0']={...drift[n].versions['4.3.3'],version:'5.0.0'};await assert.rejects(resolve({...config,read:async name=>drift[name]}),e=>e.code==='ADAPTER');
});
test('TanStack prerelease exception requires exact reviewed runtime and explicit selection',()=>{
 const manifest={dependencies:{},devDependencies:{}};const lock=v=>({lockfileVersion:3,packages:{'':manifest,'node_modules/h3-v2':{version:v,integrity:'sha512-fixture',resolved:'https://registry.npmjs.org/h3/-/h3-'+v+'.tgz'}}});
 assert.doesNotThrow(()=>verifyLock(lock('2.0.1-rc.20'),manifest,{preset:'tanstack-convex-workos',tanstackRuntime:'rc'}));
 for(const resolution of [{},{preset:'tanstack-convex-workos'}])assert.throws(()=>verifyLock(lock('2.0.1-rc.20'),manifest,resolution),e=>e.code==='LOCK');
 assert.throws(()=>verifyLock(lock('2.0.1-rc.21'),manifest,{preset:'tanstack-convex-workos',tanstackRuntime:'rc'}),e=>e.code==='LOCK');
});
