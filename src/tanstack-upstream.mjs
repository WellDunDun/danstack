import { createHash } from 'node:crypto';
import { Diagnostic, request } from './resolve.mjs';
export const templatePrefix = 'template-tanstack-start-authkit/';
// Only reviewed application files are read. No initializer, agent instructions,
// generated backend, lockfile or deployment configuration is executed/copied.
export const templateFiles = ['LICENSE','package.json','tsconfig.json','vite.config.ts','public/convex.svg','src/router.tsx','src/start.ts','src/vite-env.d.ts','src/app.css','src/routeTree.gen.ts','src/routes/__root.tsx','src/routes/index.tsx','src/routes/_authenticated.tsx','src/routes/_authenticated/authenticated.tsx','src/routes/sign-in.tsx','src/routes/sign-up.tsx','src/routes/callback.tsx','convex/schema.ts','convex/auth.config.ts','convex/convex.config.ts','convex/myFunctions.ts','convex/tsconfig.json'];
const applicationFiles = new Set(templateFiles.filter(f=>f.startsWith('src/')||f.startsWith('convex/')));
export async function authTemplate({getJson=async u=>(await request(u)).json(), getText=async u=>(await request(u)).text()}={}) {
  const base='https://api.github.com/repos/get-convex/templates';
  const commit=await getJson(`${base}/commits/main`);
  if(!/^[a-f0-9]{40}$/.test(commit?.sha)||!/^[a-f0-9]{40}$/.test(commit?.commit?.tree?.sha))throw new Diagnostic('SCAFFOLD','Invalid official template commit metadata.');
  const tree=await getJson(`${base}/git/trees/${commit.commit.tree.sha}?recursive=1`);
  if(tree.truncated||tree.sha!==commit.commit.tree.sha||!Array.isArray(tree.tree))throw new Diagnostic('SCAFFOLD','Official template tree is incomplete or mismatched.');
  const entries=tree.tree.filter(e=>e.path?.startsWith(templatePrefix));
  for(const e of entries){const p=e.path.slice(templatePrefix.length);if((p.startsWith('src/')||p.startsWith('convex/'))&&e.type!=='tree'&&!p.startsWith('convex/_generated/')&&p!=='convex/README.md'&&!applicationFiles.has(p))throw new Diagnostic('ADAPTER',`Official auth template added unreviewed application file ${p}; review its API before generation.`);}
  const records=await Promise.all(templateFiles.map(async name=>{
    const found=entries.filter(e=>e.path===templatePrefix+name);
    if(found.length!==1||found[0].mode!=='100644'||found[0].type!=='blob'||!/^[a-f0-9]{40}$/.test(found[0].sha))throw new Diagnostic('ADAPTER',`Official auth template file missing or unsafe: ${name}.`);
    const url=`https://raw.githubusercontent.com/get-convex/templates/${commit.sha}/${templatePrefix}${name}`;
    const value=await getText(url),bytes=Buffer.from(value);
    if(bytes.length>1_000_000||createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==found[0].sha)throw new Diagnostic('INTEGRITY',`Official auth template blob mismatch: ${name}.`);
    return [name,value,found[0].sha];
  }));
  const files=Object.fromEntries(records.map(([n,v])=>[n,v]));
  for(const [file,markers]of Object.entries({'src/router.tsx':['function getRouter','new ConvexReactClient','InnerWrap','setupRouterSsrQueryIntegration','getAccessToken','refresh'], 'src/start.ts':['createStart','authkitMiddleware'], 'src/routes/__root.tsx':['getAuth','serverHttpClient','accessToken'], 'src/routes/callback.tsx':['handleCallbackRoute'], 'vite.config.ts':['tanstackStart','viteReact']}))for(const marker of markers)if(!files[file].includes(marker))throw new Diagnostic('ADAPTER',`Official template ${file} no longer has reviewed ${marker} integration.`);
  const manifest=JSON.parse(files['package.json']);
  const required=['convex','react','react-dom','@convex-dev/react-query','@tanstack/react-query','@tanstack/react-router','@tanstack/react-router-ssr-query','@tanstack/react-start','@workos/authkit-tanstack-react-start'];
  if(Object.keys(manifest.dependencies??{}).sort().join()!==required.sort().join())throw new Diagnostic('ADAPTER','Official auth template dependency surface changed; review integration before generation.');
  return {files,receipt:{repository:'https://github.com/get-convex/templates',template:templatePrefix.slice(0,-1),branch:'main',commit:commit.sha,tree:tree.sha,command:'npm create convex@latest my-app -- -t tanstack-start-authkit',files:Object.fromEntries(records.map(([n,,sha])=>[n,sha])),policy:'read verified Git blobs as data; no upstream initializer, scripts, generated backend, auth provisioning or deployment configuration executed'}};
}
