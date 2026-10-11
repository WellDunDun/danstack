// Actual built Start handler, entirely synthetic requests. Never follow hosted
// redirects or permit an outbound WorkOS/Convex request in this probe.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const cwd=process.argv[2];if(!cwd)throw Error('Pass the generated app path');
const mode=process.argv[3]??'missing',events=[];
let attempted=[];globalThis.fetch=async input=>{attempted.push(String(input?.url??input));throw Error('External network disabled for synthetic auth verification');};
const server=(await import(pathToFileURL(path.join(cwd,'dist/server/server.js')))).default;
const origin='http://127.0.0.1:3000';
async function request(url,expected,headers={}){const response=await server.fetch(new Request(origin+url,{headers}));const text=await response.text();events.push({url,status:response.status,location:response.headers.get('location')?.startsWith('https://api.workos.com/') ? 'https://api.workos.com/user_management/authorize [query values redacted]' : response.headers.get('location'),cacheControl:response.headers.get('cache-control'),setCookie:response.headers.getSetCookie().map(c=>c.split('=')[0]),bodyHasSetup:text.includes('Optional: test app sign-in'),bodyBytes:Buffer.byteLength(text)});assert.equal(response.status,expected,`${url}: ${response.status} ${text.slice(0,200)}`);for(const value of ['sk_test_syntheticProbe','synthetic-cookie-password-that-is-long-enough','synthetic-invalid-cookie'])assert.ok(!text.includes(value),`Secret/cookie leaked in ${url}`);return {response,text};}
const assets=path.join(cwd,'dist/server/assets');let serverFnId;
for(const name of await readdir(assets)){const text=await readFile(path.join(assets,name),'utf8');if(text.includes('name: "getPublicSession"'))serverFnId=text.match(/id: "([a-f0-9]+)"/)?.[1];}
assert.ok(serverFnId,'Real generated server-function ID not found');
if(mode==='missing'){
 const home=await request('/',200);assert.ok(home.text.includes('Scaffolding is complete'));assert.match(home.response.headers.get('cache-control'),/no-store/);
 await request('/api/auth/sign-in?returnPathname=https://evil.invalid',503);await request('/api/auth/callback',503);
 const privatePage=await request('/authenticated',307);assert.equal(privatePage.response.headers.get('location'),'/?session=auth_failed');
 const csrf=await request('/_serverFn/'+serverFnId,403,{'Sec-Fetch-Site':'cross-site','Origin':'https://evil.invalid'});assert.ok(!csrf.text.includes('accessToken'));
}else if(mode==='synthetic'){
 const home=await request('/',200);assert.match(home.response.headers.get('cache-control'),/no-store/);
 const invalidCookie=await request('/',200,{Cookie:'wos-session=synthetic-invalid-cookie'});assert.ok(!invalidCookie.text.includes('synthetic-user'));
 const signin=await request('/api/auth/sign-in?returnPathname=//evil.invalid',307);const url=new URL(signin.response.headers.get('location'));assert.equal(url.origin,'https://api.workos.com');assert.ok(signin.response.headers.getSetCookie().some(c=>c.includes('wos-auth-verifier')),'Real SDK PKCE verifier cookie missing');
 const callback=await request('/api/auth/callback',302);assert.equal(callback.response.headers.get('location'),origin+'/?session=auth_failed');
 const other=await server.fetch(new Request('http://localhost:3000/api/auth/sign-in'));assert.equal(other.status,400);events.push({url:'alternate-loopback-origin',status:other.status});
 await request('/_serverFn/'+serverFnId,403,{'Sec-Fetch-Site':'cross-site','Origin':'https://evil.invalid'});
}else throw Error('Unknown probe mode');
assert.deepEqual(attempted,[],'An external request was attempted; not a valid local-only proof');
const client=path.join(cwd,'dist/client/assets');for(const name of await readdir(client)){if(!name.endsWith('.js'))continue;const text=await readFile(path.join(client,name),'utf8');assert.ok(!/WORKOS_API_KEY|WORKOS_COOKIE_PASSWORD|sk_test_syntheticProbe|synthetic-cookie-password-that-is-long-enough/.test(text),`Server secret/env accessor reached client bundle ${name}`);}
const result={passed:true,mode,actualBuiltHandler:true,outboundRequests:attempted,events};
await writeFile(new URL(`../receipts/tanstack-server-${mode}.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
