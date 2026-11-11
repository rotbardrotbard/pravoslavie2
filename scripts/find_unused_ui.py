#!/usr/bin/env python3
"""Найти неиспользуемые компоненты src/components/ui (нет ни одного импорта)."""
import os, re

ROOT = "/home/z/my-project"
UI = os.path.join(ROOT, "src/components/ui")

sources = []
for dp, dn, fn in os.walk(os.path.join(ROOT, "src")):
    for f in fn:
        if f.endswith((".ts", ".tsx")):
            sources.append(os.path.join(dp, f))
texts = {p: open(p, encoding="utf-8", errors="ignore").read() for p in sources}

unused, used = [], []
for f in sorted(os.listdir(UI)):
    if not f.endswith((".tsx", ".ts")):
        continue
    mod = f.rsplit(".", 1)[0]
    pats = [
        rf'@/components/ui/{re.escape(mod)}["\']',
        rf'components/ui/{re.escape(mod)}["\']',
        rf'["\']\.{1,2}/(ui/)?{re.escape(mod)}["\']',
    ]
    hits = 0
    for p, s in texts.items():
        if os.path.join(UI, f) == p:
            continue
        if any(re.search(pat, s) for pat in pats):
            hits = 1
            break
    (used if hits else unused).append(f)

print(f"UI-компонентов: {len(used) + len(unused)} | используются: {len(used)}")
print("НЕ ИСПОЛЬЗУЮТСЯ:")
for u in unused:
    print(u)
