import { lstat, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { Diagnostic } from './resolve.mjs';
const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9]|node_modules)$/i;
export async function destination(name, cwd = process.cwd(), { existing = false } = {}) {
  if (typeof name !== 'string' || name.length > 64 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || reserved.test(name))
    throw new Diagnostic('PATH', 'Use a lowercase project slug of at most 64 characters, e.g. my-app. Paths, dots, flags and reserved names are refused.');
  const parent = await realpath(cwd);
  const target = path.join(parent, name);
  let info;
  try { info = await lstat(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (info && (info.isSymbolicLink() || !info.isDirectory())) throw new Diagnostic('PATH', `Destination must be a real directory: ${target}`);
  if (existing && !info) throw new Diagnostic('PATH', `Generated project not found: ${target}`);
  if (!existing && info) {
    if ((await readdir(target)).length) throw new Diagnostic('EXISTS', `Destination is nonempty: ${target}. Choose a new name; nothing was overwritten.`);
    // Refusing even empty existing paths makes the final mkdir an exclusive reservation.
    throw new Diagnostic('EXISTS', `Destination already exists: ${target}. Choose a new name or remove the empty directory yourself.`);
  }
  return target;
}
