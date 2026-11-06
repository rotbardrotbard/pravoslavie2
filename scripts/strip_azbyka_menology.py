#!/usr/bin/env python3
"""Убирает упоминание azbyka.ru/days из шапок menology/m01..m12.ts
и показывает остаточные вхождения azbyka/Азбука в коде приложения."""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project")
PAT = " Выгрузка azbyka.ru/days."

changed = []
for i in range(1, 13):
    f = ROOT / "menology" / f"m{i:02d}.ts"
    t = f.read_text(encoding="utf-8")
    if PAT in t:
        f.write_text(t.replace(PAT, ""), encoding="utf-8")
        changed.append(f.stem)

print("Правлены шапки:", ", ".join(changed) if changed else "— уже чисто")

# остаточные вхождения в приложении (данные и код, которые попадают в сборку)
rx = re.compile(r"azbyka|Азбука", re.IGNORECASE)
left = []
for d in ("src", "menology", "bible", "public"):
    for f in (ROOT / d).rglob("*"):
        if f.is_file() and f.suffix in {".ts", ".tsx", ".json", ".svg", ".txt", ".ico", ".css"}:
            try:
                for n, line in enumerate(f.read_text(encoding="utf-8", errors="ignore"), 1):
                    if rx.search(line):
                        left.append(f"{f.relative_to(ROOT)}:{n}: {line.strip()[:80]}")
            except Exception:
                pass
print("Остаточные вхождения в src/menology/bible/public:")
print("\n".join(left) if left else "  НЕТ — чисто ✔")
