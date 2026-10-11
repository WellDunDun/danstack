#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve, presets, Diagnostic } from './resolve.mjs';
import { destination } from './paths.mjs';
import { buildFiles, writeProject } from './generate.mjs';
import { installPlan, install } from './install.mjs';
import { pathToFileURL } from 'node:url';
import { resolveBazel } from './bazel.mjs';
const help = `fresh-stack — live compatible resolution, reviewed adapters, explicit installation

Usage:
  fresh-stack create NAME [--preset convex-effect|convex-confect|cloudflare-alchemy|tanstack-convex-workos] [--alchemy-channel beta] [--tanstack-runtime rc] [--bazel] [--e2e] [--dry-run] [--json]
  fresh-stack install NAME [--dry-run] [--json]
  fresh-stack presets

Create only writes a new child directory. Install runs npm with scripts disabled.
No auth, deployment or remote initializer scripts run. Existing destinations are refused.
Create dry-run validates direct versions and the upstream scaffold in memory.
Install dry-run prints a plan; transitive resolution occurs during installation.
Dry-run writes no files or caches.

Examples:
  node src/cli.mjs create my-app --preset convex-effect --e2e --dry-run --json
  node src/cli.mjs create my-app --preset convex-confect
  node src/cli.mjs install my-app
  node src/cli.mjs install my-app --dry-run
`;
export function parse(args) {
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0]))) return { help: true };
  const [command, ...rest] = args;
  if (!['create', 'install', 'presets'].includes(command)) throw new Diagnostic('ARGUMENT', `Unknown command ${command}. Run fresh-stack --help.`);
  const options = { command, preset: 'convex-effect', e2e: false, dryRun: false, json: false };
  if (rest.includes('--help') || rest.includes('-h')) return { help: true };
  const seen = new Set();
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith('-')) {
      if (options.name) throw new Diagnostic('ARGUMENT', 'Only one project name is accepted.');
      options.name = arg; continue;
    }
    if (seen.has(arg)) throw new Diagnostic('ARGUMENT', `Duplicate option ${arg}.`);
    seen.add(arg);
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--e2e' && command === 'create') options.e2e = true;
    else if (arg === '--bazel' && command === 'create') options.bazel = true;
    else if (arg === '--alchemy-channel' && command === 'create') {
      options.alchemyChannel = rest[++i];
      if (options.alchemyChannel !== 'beta') throw new Diagnostic('ARGUMENT', '--alchemy-channel accepts beta only.');
    }
    else if (arg === '--tanstack-runtime' && command === 'create') {
      options.tanstackRuntime = rest[++i];
      if (options.tanstackRuntime !== 'rc') throw new Diagnostic('ARGUMENT', '--tanstack-runtime accepts rc only, for the exact reviewed H3 runtime required by released TanStack Start.');
    }
    else if (arg === '--preset' && command === 'create') {
      const value = rest[++i];
      if (!value || value.startsWith('-')) throw new Diagnostic('ARGUMENT', '--preset needs a value.');
      options.preset = value;
    } else throw new Diagnostic('ARGUMENT', `Unknown option ${arg} for ${command}. Run fresh-stack ${command} --help.`);
  }
  if (command === 'presets') {
    if (rest.length) throw new Diagnostic('ARGUMENT', 'presets takes no arguments.');
  } else if (!options.name) throw new Diagnostic('ARGUMENT', `Project name required. Example: fresh-stack ${command} my-app`);
  return options;
}
export async function main(args = process.argv.slice(2)) {
  const options = parse(args);
  if (options.help) { console.log(help); return; }
  if (options.command === 'presets') { console.log(presets.join('\n')); return; }
  const target = await destination(options.name, process.cwd(), { existing: options.command === 'install' });
  const version = spawnSync('npm', ['--version'], { encoding: 'utf8' });
  if (version.status !== 0) throw new Diagnostic('RUNTIME', 'npm is required; could not read npm --version.');
  const runtime = { node: process.versions.node, npm: version.stdout.trim() };
  let result;
  if (options.command === 'create') {
    const resolution = await resolve({ ...options, ...runtime });
    if (options.bazel) resolution.buildTools = await resolveBazel(resolution.packages);
    const files = await buildFiles(options.name, resolution);
    result = { action: options.dryRun ? 'plan' : 'created', target, files: Object.keys(files).sort(), resolution, next: [`fresh-stack install ${options.name}`, ...(options.preset === 'convex-confect' ? [`cd ${options.name} && npm run codegen:local`] : [])] };
    if (!options.dryRun) await writeProject(target, files);
  } else {
    const plan = await installPlan(target, runtime);
    result = { action: options.dryRun ? 'install-plan' : 'installed', target, command: [plan.command, ...plan.args] };
    if (!options.dryRun) await install(plan);
  }
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.action}: ${target}`);
    if (result.resolution) for (const [p, meta] of Object.entries(result.resolution.packages)) console.log(`  ${p}@${meta.version}`);
    for (const choice of result.resolution?.selections ?? []) console.log(`Selection: ${choice.name}@${choice.selected} (latest eligible ${choice.latestEligible}; dist-tag latest ${choice.distTagLatest ?? 'absent'}): ${JSON.stringify(choice.reasons)}`);
    if (result.command) console.log(result.command.join(' '));
    for (const next of result.next ?? []) console.log(`Next: ${next}`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ error: error.code ?? 'FAILED', message: error.message, ...(error.details ? { details: error.details } : {}) }));
    process.exitCode = 1;
  });
}
