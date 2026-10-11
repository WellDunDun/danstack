// Explicit historical integration fixture graph. No production fallback.
import {readFile,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const name of ['alchemy-demo','alchemy-ui','alchemy-bazel','alchemy-bazel-ui']){
 const dir=root+'samples/'+name+'/';const receipt=JSON.parse(await readFile(dir+'fresh-stack.json'));if(!receipt.snapshotReplay)throw new Error('Refusing non-fixture project');
 const file=name.endsWith('ui')?'alchemy-live-snapshot-ui':'alchemy-live-snapshot';const lock=JSON.parse(await readFile(root+'test/fixtures/'+file+'/package-lock.json'));
 const manifest=JSON.parse(await readFile(dir+'package.json'));lock.name=manifest.name;lock.packages[''].name=manifest.name;lock.packages[''].dependencies=manifest.dependencies;lock.packages[''].devDependencies=manifest.devDependencies;
 await writeFile(dir+'package-lock.json',JSON.stringify(lock,null,2)+'\n',{flag:'wx'});console.log(`Seeded explicit historical locked graph: ${name}`);
}
