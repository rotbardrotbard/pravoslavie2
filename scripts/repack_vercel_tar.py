#!/usr/bin/env python3
"""Пересборка download/pravoslavnye-vercel.tar.gz из git-трекнутых файлов
(без download/, .env, служебных папок шаблона) + верификация лимита
«не более 99 объектов в папке»: корень, прямые дети, рекурсивные суммы."""
import os
import subprocess
import sys
import tarfile

ROOT = "/home/z/my-project"
OUT = os.path.join(ROOT, "download", "pravoslavnye-vercel.tar.gz")
EXCLUDE_TOPS = {
    "download", ".env", ".zscripts", "assets", "examples",
    "mini-services", "tool-results", "skills", "upload",
}
EXTRA_FILES = ["next-env.d.ts"]


def tracked_files():
    res = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    )
    files = []
    for line in res.stdout.splitlines():
        name = line.strip()
        if not name or name == ".env" or name.split("/")[0] in EXCLUDE_TOPS:
            continue
        files.append(name)
    for extra in EXTRA_FILES:
        if os.path.isfile(os.path.join(ROOT, extra)) and extra not in files:
            files.append(extra)
    return sorted(set(files))


def build():
    files = tracked_files()
    dirs = set()
    for f in files:
        parts = f.split("/")
        for i in range(1, len(parts)):
            dirs.add("/".join(parts[:i]))
    with tarfile.open(OUT, "w:gz") as tar:
        def add(name, is_dir):
            info = tarfile.TarInfo("./" + name)
            info.mtime = 1762300000
            if is_dir:
                info.type = tarfile.DIRTYPE
                info.mode = 0o755
                info.size = 0
                tar.addfile(info)
            else:
                info.type = tarfile.REGTYPE
                info.mode = 0o644
                info.size = os.path.getsize(os.path.join(ROOT, name))
                with open(os.path.join(ROOT, name), "rb") as fh:
                    tar.addfile(info, fh)
        for d in sorted(dirs):
            add(d, True)
        for f in files:
            add(f, False)
    return len(files), len(dirs)


def verify():
    children, rec, root_objs = {}, {}, set()
    with tarfile.open(OUT) as tar:
        names = tar.getnames()
    for raw in names:
        n = raw[2:] if raw.startswith("./") else raw
        if not n:
            continue
        parts = n.split("/")
        root_objs.add(parts[0])
        children.setdefault("/".join(parts[:-1]), set()).add(parts[-1])
        if len(parts) >= 2:
            rec[parts[0]] = rec.get(parts[0], 0) + 1
    print(f"Архив: {OUT}")
    print(f"Размер: {os.path.getsize(OUT)/1024/1024:.2f} МБ, записей: {len(names)}")
    print(f"Объектов в корне: {len(root_objs)}")
    bad = []
    for k in sorted(rec):
        mark = "OK" if rec[k] <= 99 else ">99 !!!"
        if rec[k] > 99:
            bad.append(k)
        print(f"  {k:28s} {rec[k]:4d}  {mark}")
    mx = sorted(((d, len(c)) for d, c in children.items()), key=lambda x: -x[1])[:6]
    print("Прямые дети (топ-6):")
    for d, c in mx:
        if c > 99:
            bad.append(d)
        print(f"  {(d or '<КОРЕНЬ>'):40s} {c:3d}  {'OK' if c <= 99 else '>99 !!!'}")
    if len(root_objs) > 99:
        bad.append("<КОРЕНЬ>")
    print("ИТОГ: ЛИМИТ СОБЛЮДЁН — нигде не больше 99." if not bad else f"ПРОВАЛ: {bad}")
    return not bad


if __name__ == "__main__":
    nf, nd = build()
    print(f"Упаковано: {nf} файлов, {nd} папок\n")
    sys.exit(0 if verify() else 1)
