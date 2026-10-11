from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
exclude = {'node_modules', 'dist', '.output', '.tanstack', '.e2e', '.convex', '__pycache__', '.bazel-cache', '.bazel-tools', '.alchemy', '.alchemy-local', '.git', 'build'}
files = [root / name for name in ['README.md', 'package.json', 'package-lock.json', '.gitignore', 'THIRD-PARTY-NOTICES.md']]
for directory in ['src', 'templates', 'test', 'scripts', 'receipts']:
    files += [p for p in (root / directory).rglob('*') if p.is_file() and not p.is_symlink() and not any(part in exclude for part in p.relative_to(root).parts) and not p.name.startswith(('library-', 'delivery-')) and (not p.name.startswith('.env') or p.name == '.env.example') and p.suffix not in {'.env', '.pem', '.key', '.zip', '.mp4', '.webm'} and p.name not in {'.npmrc', 'credentials.json', 'source-archive.sha256'}]
files += [root / 'research/create-vite-9.2.1.tgz', root / 'research/CREATE-VITE-LICENSE.md']
output = root / 'danstack-source.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(set(files)):
        archive.write(file, 'danstack/' + str(file.relative_to(root)))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'danstack/templates/tanstack/.env.example' in archive.namelist()
    assert 'danstack/templates/tanstack/SHADCN-LICENSE.md' in archive.namelist()
    assert 'danstack/research/CREATE-VITE-LICENSE.md' in archive.namelist()
    assert not any('/samples/' in p or (Path(p).name.startswith('.env') and Path(p).name != '.env.example') for p in archive.namelist())
print(f'{output}: {output.stat().st_size} bytes; {len(set(files))} files')
