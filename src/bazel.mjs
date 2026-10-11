import semver from 'semver';
import { createHash } from 'node:crypto';
import { request, Diagnostic } from './resolve.mjs';
const bounds = { bazel: '>=9.3.0 <10', aspect_rules_js: '>=3.5.1 <3.6', rules_nodejs: '>=6.7.6 <6.8', node: '>=26.11.1 <27' };
export async function resolveBazel(packages, { get = async url => (await request(url)).json(), getText = async url => (await request(url)).text() } = {}) {
  const result = {};
  const release = await get('https://api.github.com/repos/bazelbuild/bazel/releases/latest');
  result.bazel = { version: release.tag_name, assets: {} };
  if (release.prerelease || release.draft) throw new Diagnostic('BAZEL', 'Latest Bazel release is not stable.');
  for (const platform of ['darwin-arm64', 'darwin-x86_64', 'linux-arm64', 'linux-x86_64']) {
    const name = `bazel-${release.tag_name}-${platform}`;
    const binary = release.assets.find(a => a.name === name);
    const sum = release.assets.find(a => a.name === `${name}.sha256`);
    if (!binary || !sum) throw new Diagnostic('BAZEL', `Official Bazel release lacks ${platform}.`);
    const checksum = binary.digest?.startsWith('sha256:') ? binary.digest.slice(7) : (await getText(sum.browser_download_url)).trim().split(/\s+/)[0];
    if (!/^[a-f0-9]{64}$/.test(checksum)) throw new Diagnostic('BAZEL', `Invalid ${platform} checksum.`);
    result.bazel.assets[platform] = { url: binary.browser_download_url, sha256: checksum };
  }
  for (const name of ['aspect_rules_js', 'rules_nodejs']) {
    const index = await get(`https://bcr.bazel.build/modules/${name}/metadata.json`);
    const version = semver.rsort(index.versions.filter(v => semver.valid(v) && !semver.prerelease(v) && !index.yanked_versions?.[v]))[0];
    const module = await getText(`https://bcr.bazel.build/modules/${name}/${version}/MODULE.bazel`);
    const compat = /bazel_compatibility\s*=\s*\[([^\]]*)\]/.exec(module)?.[1];
    if (compat) for (const range of [...compat.matchAll(/"([^"]+)"/g)].map(m => m[1])) if (!semver.satisfies(release.tag_name, range)) throw new Diagnostic('BAZEL', `${name}@${version} requires Bazel ${range}.`);
    result[name] = { version, moduleSha256: createHash('sha256').update(module).digest('hex'), source: await get(`https://bcr.bazel.build/modules/${name}/${version}/source.json`) };
  }
  const nodes = await get('https://nodejs.org/dist/index.json');
  const node = nodes.filter(n => semver.valid(n.version) && !semver.prerelease(n.version)).sort((a, b) => semver.rcompare(a.version, b.version))[0].version.slice(1);
  result.node = { version: node, sha256Manifest: await getText(`https://nodejs.org/dist/v${node}/SHASUMS256.txt`) };
  for (const [name, meta] of Object.entries(result)) if (!semver.satisfies(meta.version, bounds[name])) throw new Diagnostic('BAZEL_ADAPTER', `${name}@${meta.version} exceeds reviewed adapter ${bounds[name]}; no downgrade.`);
  for (const [name, meta] of Object.entries(packages)) if (meta.engines?.node && !semver.satisfies(node, meta.engines.node)) throw new Diagnostic('ENGINE', `Bazel Node ${node} conflicts with ${name}@${meta.version} engine ${meta.engines.node}.`);
  return result;
}
export function bazelFiles(resolution) {
  const confect = resolution.preset === 'convex-confect';
  const alchemy = resolution.preset === 'cloudflare-alchemy';
  const platforms = { 'darwin-arm64.tar.gz':'darwin_arm64', 'darwin-x64.tar.gz':'darwin_amd64', 'linux-x64.tar.xz':'linux_amd64', 'linux-arm64.tar.xz':'linux_arm64', 'linux-s390x.tar.xz':'linux_s390x', 'linux-ppc64le.tar.xz':'linux_ppc64le', 'win-x64.zip':'windows_amd64', 'win-arm64.zip':'windows_arm64' };

  const { bazel: b, aspect_rules_js: js, rules_nodejs: nodeRules, node } = resolution.buildTools;
  const archives = {};
  for (const line of node.sha256Manifest.trim().split('\n')) {
    const [sha, file] = line.trim().split(/\s+/);
    const platform = platforms[file?.replace(`node-v${node.version}-`, '')];
    if (platform) archives[`${node.version}-${platform}`] = [file, file.replace(/\.tar\.(gz|xz)$|\.zip$/, ''), sha];
  }
  const files = {
    'pnpm-workspace.yaml': "allowBuilds:\n  '*': false\n",
    '.bazelversion': `${b.version}\n`, '.nvmrc': `${node.version}\n`,
    '.bazelignore': 'node_modules\n.bazel-cache\n.bazel-tools\n.alchemy-local\n.alchemy\ndist\n.e2e\n',
    '.bazelrc': 'common --enable_bzlmod\ncommon --lockfile_mode=update\nbuild --incompatible_strict_action_env\nbuild --action_env=DO_NOT_TRACK=1\nbuild --action_env=ALCHEMY_TELEMETRY_DISABLED=1\ntest --test_output=errors\n',
    'MODULE.bazel': `module(name = "fresh_stack")\nbazel_dep(name = "aspect_rules_js", version = "${js.version}")\nbazel_dep(name = "rules_nodejs", version = "${nodeRules.version}")\nnode = use_extension("@rules_nodejs//nodejs:extensions.bzl", "node")\nnode.toolchain(node_version = "${node.version}", node_repositories = ${JSON.stringify(archives)})\nuse_repo(node, "nodejs_toolchains")\nregister_toolchains("@nodejs_toolchains//:all")\nnpm = use_extension("@aspect_rules_js//npm:extensions.bzl", "npm")\nnpm.npm_translate_lock(name = "npm", pnpm_lock = "//:pnpm-lock.yaml", update_pnpm_lock = False, verify_node_modules_ignored = "//:.bazelignore", lifecycle_hooks = {}, data = ["//:pnpm-workspace.yaml"])\nuse_repo(npm, "npm")\n`,
    'BUILD.bazel': `load("@npm//:defs.bzl", "npm_link_all_packages")\nload("@aspect_rules_js//js:defs.bzl", "js_binary", "js_library", "js_run_binary", "js_test")\nnpm_link_all_packages(name = "node_modules")\njs_library(name = "sources", srcs = glob(["src/**", "tests/**/*.ts", "convex/*.ts", "confect/**", "worker/**", "infra/**", "scripts/*.ts", "alchemy.run.ts", "e2e.config.ts", "convex.json"], exclude = ["confect/_generated/**", ${confect ? '"convex/*.ts"' : '"__unused__"'}], allow_empty = True) + ["index.html", "tsconfig.json", "package.json"], ${alchemy ? 'deps = []' : 'deps = [":node_modules"]'})\n${confect ? 'js_binary(name = "codegenerator", entry_point = "scripts/bazel-codegen.mjs", data = [":sources"])\njs_run_binary(name = "codegen", tool = ":codegenerator", srcs = [":sources"], out_dirs = ["generated"], mnemonic = "ConfectCodegen")\n' : ''}js_binary(name = "builder", entry_point = "scripts/bazel-build.mjs", data = [":sources"${alchemy ? ', ":node_modules/effect", ":node_modules/vite"' : ''}${confect ? ', ":codegen"' : ''}])\njs_run_binary(name = "bundle", tool = ":builder", srcs = [":sources"${confect ? ', ":codegen"' : ''}], out_dirs = ["bundle"], args = ["bundle"], mnemonic = "ViteBundle")\njs_test(name = "unit", entry_point = "${confect ? 'scripts/bazel-unit.mjs' : 'tests/unit.test.ts'}", node_options = ["--import=tsx"], data = [":sources"${alchemy ? ', ":node_modules/effect", ":node_modules/tsx"' : ''}${confect ? ', ":codegen"' : ''}])\njs_test(name = "typecheck", entry_point = "scripts/bazel-typecheck.mjs", data = [":sources"${alchemy ? ', ":node_modules"' : ''}${confect ? ', ":codegen"' : ''}])\n`,
    'scripts/bazel-build.mjs': `import { build } from 'vite';\nimport { fileURLToPath } from 'node:url';\nimport { realpathSync } from 'node:fs';\nconst base = realpathSync(fileURLToPath(new URL('../', import.meta.url)));\nconst root = base + '${confect ? '/generated' : ''}';\nawait build({ root, resolve: { preserveSymlinks: true }, build: { outDir: base + '/' + process.argv[2], emptyOutDir: true } });\n${alchemy ? `await build({ root, resolve: { preserveSymlinks: true }, build: { outDir: base + '/' + process.argv[2] + '/worker', emptyOutDir: true, lib: { entry: root + '/worker/main.ts', formats: ['es'], fileName: 'main' } } });\n` : ''}`,
    'scripts/bazel-typecheck.mjs': `import { spawnSync } from 'node:child_process';\nconst result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--project', '${confect ? 'generated/' : ''}tsconfig.json'], { stdio: 'inherit' });\nprocess.exitCode = result.status ?? 1;\n`,
  };
  return files;
}
