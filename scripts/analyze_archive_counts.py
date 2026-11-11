#!/usr/bin/env python3
"""Count objects per directory in tar.gz / zip archives, flag folders with >99 objects."""
import sys, tarfile, zipfile, collections

ARCHIVE = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/download/pravoslavnye-vercel.tar.gz'

def norm(n):
    n = n.lstrip('./')
    return n.rstrip('/')

children = collections.defaultdict(set)
files_total = 0
top = collections.Counter()

if ARCHIVE.endswith('.tar.gz'):
    t = tarfile.open(ARCHIVE)
    entries = [m.name for m in t.getmembers()]
else:
    z = zipfile.ZipFile(ARCHIVE)
    entries = z.namelist()

for raw in entries:
    n = norm(raw)
    if not n:
        continue
    parts = n.split('/')
    files_total += 1
    top[parts[0]] += 1
    for i in range(1, len(parts)):
        parent = '/'.join(parts[:i])
        children[parent].add(parts[i])

print(f'Archive: {ARCHIVE}')
print(f'Entries (files+dirs): {files_total}')
print(f'Root-level objects: {len(top)} -> {sorted(top.keys())}')
print('Objects per top-level folder:')
for k in sorted(top):
    print(f'  {k:30s} {top[k]}')
viol = {d: len(c) for d, c in children.items() if len(c) > 99}
all_dirs = {d: len(c) for d, c in children.items()}
mx = sorted(all_dirs.items(), key=lambda x: -x[1])[:12]
print('Top-12 folders by object count:')
for d, c in mx:
    flag = '  <-- >99!' if c > 99 else ''
    print(f'  {d:45s} {c}{flag}')
if viol:
    print(f'VIOLATIONS (>99 objects): {len(viol)} folders')
    for d, c in sorted(viol.items(), key=lambda x: -x[1]):
        print(f'  {d}: {c}')
else:
    print('OK: no folder exceeds 99 objects.')
