import { requirements } from '../src/resolve.mjs';
export const versions = { convex: '1.46.0', effect: '4.0.2', vite: '8.3.4', typescript: '7.0.2', 'create-vite': '9.2.1', '@types/node': '26.6.5', tsx: '4.23.15', 'convex-test': '0.0.61', '@confect/core': '10.2.0', '@confect/server': '10.2.0', '@confect/cli': '10.2.0', e2e: '0.19.0', '@e2e-dev/web': '0.14.0' };
export function fixture() {
  const records = {};
  for (const [name, version] of Object.entries(versions)) records[name] = { versions: { [version]: { name, version, dist: { integrity: 'sha512-fixture', tarball: 'https://registry.npmjs.org/fixture.tgz' }, engines: { node: '>=24' } } } };
  records['@confect/server'].versions['10.2.0'].peerDependencies = { convex: '^1.45.0', effect: '^4.0.1', '@confect/core': '^10.2.0', '@effect/platform-node': '^4' };
  records['@confect/server'].versions['10.2.0'].peerDependenciesMeta = { '@effect/platform-node': { optional: true } };
  records['@e2e-dev/web'].versions['0.14.0'].peerDependencies = { e2e: '>=0.18.0 <1' };
  return records;
}
export const read = data => async name => { if (!data[name]) throw new Error(`Unexpected package ${name}`); return structuredClone(data[name]); };
export const config = { preset: 'convex-effect', e2e: true, node: '25.8.1', npm: '11.11.0' };
export function add(data, name, version, changes = {}) {
  data[name].versions[version] = { ...data[name].versions[versions[name]], ...changes, version };
}
export const scaffold = async () => ({ _gitignore: 'node_modules\ndist\n', 'index.html': '<div id="app"></div><title>Vite</title><script type="module" src="/src/main.ts"></script>', 'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2023', module: 'ESNext', lib: ['ES2023', 'DOM'], noEmit: true, strict: true, moduleResolution: 'bundler', skipLibCheck: true, allowImportingTsExtensions: true }, include: ['src'] }) });
