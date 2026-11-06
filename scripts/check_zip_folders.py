#!/usr/bin/env python3
"""Проверка лимита GitHub: <=99 прямых детей в корне и в каждой папке архива."""
import zipfile
from collections import defaultdict

ZIP = "/home/z/my-project/download/pravoslavnye-github-novyj-repo.zip"

children = defaultdict(set)
for name in zipfile.ZipFile(ZIP).namelist():
    parts = name.rstrip("/").split("/")
    for i in range(len(parts)):
        folder = "." if i == 0 else "/".join(parts[:i])
        children[folder].add(parts[i])

root = sorted(children["."])
folders = {f: len(v) for f, v in children.items() if f != "."}
worst = max(folders.items(), key=lambda kv: kv[1]) if folders else ("-", 0)
bad = {f: n for f, n in sorted(folders.items()) if n > 99}

print(f"Корень: {len(root)} объектов (лимит 99) — {'OK' if len(root) <= 99 else 'ПРЕВЫШЕН!'}")
print(f"Самая большая папка: {worst[0]} = {worst[1]} — {'OK' if worst[1] <= 99 else 'ПРЕВЫШЕН!'}")
print(f"Всего папок: {len(folders)}; нарушений (>99): {'НЕТ' if not bad else bad}")
print("\nДетали:")
print("  корень:", ", ".join(root))
big = sorted(folders.items(), key=lambda kv: -kv[1])[:6]
for f, n in big:
    print(f"  {f}: {n}")
