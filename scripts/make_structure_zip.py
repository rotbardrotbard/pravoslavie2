#!/usr/bin/env python3
"""Zip с изменениями для веб-заливки на GitHub + инструкция (README)."""
import os
import zipfile

ROOT = "/home/z/my-project"
OUT = os.path.join(ROOT, "download", "svyatcy-i-struktura-update.zip")

add_files = (
    [f"menology/{f}" for f in sorted(os.listdir(os.path.join(ROOT, "menology")))]
    + [
        "src/lib/content/calendar.ts",
        "src/components/prototype/screens/CalendarScreen.tsx",
        "scripts/fetch_menology2.py",
        "scripts/gen_menology2.py",
        "scripts/repack_vercel_tar.py",
    ]
)

readme = """ОБНОВЛЕНИЕ: ПОЛНЫЕ СВЯТЦЫ + ЛИМИТ «НЕ БОЛЕЕ 99 ОБЪЕКТОВ В ПАПКЕ»
=================================================================

1) ЗАГРУЗИТЬ (пути в zip сохранены, класть в корень репозитория):
   menology/                      — 13 файлов (m01..m12.ts + types.ts):
                                    полный месяцеслов на год: 3186 записей,
                                    у КАЖДОГО святого краткое описание,
                                    у 99 известных — ссылка на полное житие.
   src/lib/content/calendar.ts                        — заменить
   src/components/prototype/screens/CalendarScreen.tsx — заменить
   scripts/ (3 файла)                                  — заменить/добавить

2) УДАЛИТЬ ИЗ РЕПОЗИТОРИЯ:
   а) src/lib/content/bible/      — папка целиком (28 файлов; это дубликаты
                                    корневой bible/, приложение их не читает);
   б) 37 неиспользуемых компонентов src/components/ui/:
      accordion.tsx, alert-dialog.tsx, alert.tsx, aspect-ratio.tsx, avatar.tsx,
      badge.tsx, breadcrumb.tsx, calendar.tsx, card.tsx, carousel.tsx, chart.tsx,
      checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx, drawer.tsx,
      dropdown-menu.tsx, form.tsx, hover-card.tsx, input-otp.tsx, menubar.tsx,
      navigation-menu.tsx, pagination.tsx, popover.tsx, progress.tsx,
      radio-group.tsx, resizable.tsx, scroll-area.tsx, select.tsx, sidebar.tsx,
      slider.tsx, sonner.tsx, switch.tsx, table.tsx, tabs.tsx, textarea.tsx,
      toggle-group.tsx

3) ПОСЛЕ ЗАГРУЗКИ: Vercel пересоберёт проект автоматически
   (или вручную: Deployments → Redeploy). Затем проверить в ОК.

РЕЗУЛЬТАТ: корень репозитория — 19 объектов; самая большая папка src — 62.
Лимит «не более 99 объектов в папке» соблюдён везде.
"""

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for rel in add_files:
        z.write(os.path.join(ROOT, rel), rel)
    z.writestr("README-ИЗМЕНЕНИЯ.txt", readme)

print(f"{OUT}: {os.path.getsize(OUT)/1024:.0f} КБ, файлов: {len(add_files)} + README")
