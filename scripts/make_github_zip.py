#!/usr/bin/env python3
"""Единый архив проекта для создания НОВОГО репозитория на GitHub.

Состав: git-трекаемые файлы рабочей версии (HEAD) + next-env.d.ts + README.md.
Исключено: .env (секрет), download/ (артефакты доставки),
.zscripts/ и tool-results/ (служебные файлы песочницы),
examples/ и mini-services/ (каркас шаблона).
Внутрь архива добавляются README.md (для репозитория) и
ИНСТРУКЦИЯ-НОВЫЙ-РЕПО.txt (шаги: создать репо, залить файлы, подключить Vercel).
После сборки проверяется лимит <=99 объектов в каждой папке и целостность.
"""
import subprocess
import zipfile
from pathlib import Path
from collections import defaultdict

ROOT = Path("/home/z/my-project")
OUT = ROOT / "download" / "pravoslavnye-github-novyj-repo.zip"
README_NAME = "README.md"
INSTR_NAME = "ИНСТРУКЦИЯ-НОВЫЙ-РЕПО.txt"

# Что НЕ публикуем на GitHub
EXCLUDE = {
    ".env",                       # секрет — никогда не в репозиторий
    "download",                   # скриншоты/pdf/zip — артефакты доставки
    ".zscripts", "tool-results",  # служебные файлы песочницы
    "examples", "mini-services",  # каркас шаблона, к приложению отношения не имеет
}
INCLUDE_TOPS = {"src", "menology", "bible", "public", "scripts",
                "assets", "prisma", "db", "tests"}
ROOT_FILES = ["package.json", "bun.lock", "next.config.ts", "tsconfig.json",
              "tailwind.config.ts", "postcss.config.mjs", "eslint.config.mjs",
              "components.json", ".gitignore"]

README_MD = """# Православные

Мини-приложение для соцсети «Одноклассники» (платформа мини-приложений VK/ОК).

Молитвослов, Евангелие и Деяния, святцы с житиями, православная библиотека
(цитаты отцов, ответы на вопросы), церковный календарь и карта храмов.
Тёмная графитово-золотая палитра, фото храмов с мягким виньетированием.
Контент встроен в приложение целиком — внешние ссылки не используются.

## Стек

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui (Radix)
- Prisma 6 (SQLite)
- @vkontakte/vk-bridge — интеграция с платформой мини-приложений
- Framer Motion, Zustand

## Структура проекта

| Путь | Содержимое |
| --- | --- |
| `src/app` | экраны и API-маршруты (`/api`, `/api/questions`) |
| `src/components/prototype` | экраны приложения, ReaderOverlay, модальные окна |
| `src/components/ui` | переиспользуемые UI-компоненты |
| `src/lib/content` | загрузчики контента (Библия, святцы, библиотека) |
| `src/lib` | bridge платформы, локальное хранилище, утилиты |
| `menology/` | святцы: 12 месяцев, 3186 записей с описанием каждого святого |
| `bible/` | 28 книг (JSON), читаются лоадером `src/lib/content/bible.ts` |
| `public/` | иконки, favicon, фото храмов |
| `scripts/` | генераторы (святцы из `menology_raw.json`, Библия) и проверки |
| `assets/` | исходники изображений |
| `prisma/`, `db/` | схема и локальная база |

Каждая папка содержит не более 99 объектов — удобно для веб-загрузки на GitHub.

## Запуск локально

```bash
bun install        # или npm install
npm run dev        # http://localhost:3000
```

## Сборка и деплой

Проект деплоится на Vercel (Next.js, standalone-сборка — см. `package.json`).
Переменные окружения задаются в настройках Vercel и в репозитории не хранятся
(`.env` в репозиторий не входит).

После изменения кода: push в репозиторий → Vercel собирает новую версию
автоматически → проверка сайта → открытие мини-приложения в ОК.
"""

INSTR_TEXT = """ПРАВОСЛАВНЫЕ — архив для создания НОВОГО репозитория на GitHub
================================================================
Версия кода: 86a7535 «Фикс белого экрана: санитизация данных старых версий
(pr.prayerLog, pr.likedVerses...) + экраны ошибок error.tsx/global-error.tsx».
База: dc1b076 — масштаб интерфейса 100/115/130%; e6793ce — удалён шаблонный
logo.svg и z-ai-web-dev-sdk; d400e63 — светлая минималистичная иконка;
89c8413 — обложки библиотеки: образы святых и книги;
add0724 — обложки цитат отцов + пакеты А/Б/В; 3bc6354 — удалены упоминания
"Азбуки веры"; 4b07d9b — святцы 3186 записей (у каждого описание),
структура: каждая папка <=99 объектов.
Изображений в public/images: 47 (7 базовых + 6 храмов + 6 открыток/подарков
+ 6 книг/библиотеки + 22 иконописных образа святых); исходники — assets/src/*.png.
Сборка Next.js проверена, рабочая версия: https://pravoslavie.vercel.app

ШАГ 1. Создайте репозиторий
---------------------------
1. github.com -> кнопка "+" (справа вверху) -> New repository.
2. Name: например pravoslavie (латиницей, без пробелов).
3. Public или Private — Vercel работает и с приватными.
4. НИЧЕГО не добавляйте при создании: снимите галочку "Add a README file"
   (и не добавляйте .gitignore / license) — иначе будет конфликт при заливке.
5. Create repository.

ШАГ 2. Загрузите файлы
----------------------
1. Распакуйте архив в папку на компьютере.
2. На странице нового репозитория нажмите ссылку
   "uploading an existing file".
3. Перетащите в окно браузера ВСЁ содержимое распакованной папки:
   - папки: src, menology, bible, public, scripts, assets, prisma, db, tests;
   - корневые файлы: package.json, bun.lock, next.config.ts, tsconfig.json,
     tailwind.config.ts, postcss.config.mjs, eslint.config.mjs,
     components.json, .gitignore, next-env.d.ts, README.md.
4. Ограничение браузера: не больше 100 файлов за одну загрузку.
   Каждая папка здесь содержит <=99 файлов — папку можно тащить целиком.
   Удобно в два приёма: сначала все папки, потом корневые файлы —
   а Commit changes нажать один раз в конце.
5. Файл ИНСТРУКЦИЯ-НОВЫЙ-РЕПО.txt (этот) в репозиторий можно не загружать.
6. Файла .env в архиве НЕТ — секреты в репозиторий не заливаются,
   они хранятся только в Vercel (Settings -> Environment Variables).

ШАГ 3. Подключите Vercel — вариант А (рекомендую)
-------------------------------------------------
Домен и приложение в ОК останутся прежними.
1. vercel.com -> ваш проект pravoslavie -> Settings -> Git.
2. Disconnect текущий репозиторий -> Connect Git Repository -> новый репо.
3. Deployments -> Redeploy -> дождитесь зелёного статуса.
4. Домен не меняется: pravoslavie.vercel.app — мини-приложение в ОК
   продолжит работать без правок.

ШАГ 3. Вариант Б — отдельный новый проект Vercel
------------------------------------------------
1. vercel.com -> Add New... -> Project -> Import ваш новый репозиторий
   -> Deploy (настройки определятся сами).
2. Дождитесь сборки, скопируйте новый домен вида <имя>.vercel.app.
3. Обновите адреса мини-приложения: dev.vk.com -> ваше приложение ->
   Настройки -> «URL размещения» и «URL для мобильной версии сайта» ->
   укажите новый домен. Синхронизация с ОК — до 30 минут.

ШАГ 4. Проверка
---------------
1. Откройте домен в браузере — должен открыться экран «Православные».
2. Откройте приложение в ОК (https://ok.ru/app/512005604973) и обновите
   страницу с очисткой кэша: Ctrl+Shift+R.

О СТАРОМ РЕПОЗИТОРИИ
--------------------
- Если в старом репозитории остался файл .env — удалите его там
  (секрет считается скомпрометированным) и обновите значения переменных
  в Vercel -> Settings -> Environment Variables.
- После успешного перехода старый репозиторий можно удалить или оставить.
"""


def tracked_files():
    r = subprocess.run(["git", "ls-files"], cwd=ROOT,
                       capture_output=True, text=True, check=True)
    return [l.strip() for l in r.stdout.splitlines() if l.strip()]


def main():
    files = []
    for p in tracked_files():
        top = p.split("/")[0]
        if top in EXCLUDE or p in EXCLUDE:
            continue
        if top in INCLUDE_TOPS or p in ROOT_FILES:
            files.append(p)
        else:
            print(f"  ! пропущен (не входит в список включения): {p}")
    if (ROOT / "next-env.d.ts").exists():
        files.append("next-env.d.ts")
    files = sorted(set(files))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in files:
            src = ROOT / rel
            if not src.is_file():
                print(f"  !! нет на диске: {rel}")
                continue
            z.write(src, rel)
        z.writestr(README_NAME, README_MD)
        z.writestr(INSTR_NAME, INSTR_TEXT)

    # ---- Верификация ----
    names = zipfile.ZipFile(OUT).namelist()
    size_mb = OUT.stat().st_size / 1024 / 1024
    raw_mb = sum(i.file_size for i in zipfile.ZipFile(OUT).infolist()) / 1024 / 1024

    # лимит <=99 объектов в каждой папке (прямые дети: файлы и подпапки)
    children = defaultdict(set)
    for n in names:
        parts = n.split("/")
        for i in range(len(parts)):
            folder = "." if i == 0 else "/".join(parts[:i])
            children[folder].add(parts[i])
    over = {f: len(v) for f, v in children.items() if len(v) > 99}
    root_objs = len(children.get(".", set()))
    sub = {f: len(v) for f, v in children.items() if f != "."}
    max_folder = max(sub.items(), key=lambda kv: kv[1])

    # секреты и мусор
    bad = [n for n in names if n == ".env" or n.split("/")[0] in
           {"download", ".zscripts", "tool-results", "examples", "mini-services"}]

    # ключевые файлы на месте
    must = ["package.json", "next.config.ts", "README.md",
            "src/lib/content/bible.ts", "src/lib/content/calendar.ts",
            "src/lib/content/lives.ts", "menology/types.ts",
            "public/icon.svg", "next-env.d.ts", ".gitignore"] + \
           [f"menology/m{i:02d}.ts" for i in range(1, 13)] + \
           [f"bible/{n}.json" for n in (40, 43, 44, 45, 46, 47, 49, 50)]
    missing = [m for m in must if m not in names]

    print(f"Архив: {OUT.name}")
    print(f"Файлов в архиве: {len(names)} (README.md + инструкция)")
    print(f"Размер: {size_mb:.1f} МБ (распакованно ~{raw_mb:.1f} МБ)")
    print(f"Объектов в корне архива: {root_objs}")
    print(f"Самая большая папка: {max_folder[0]} = {max_folder[1]} объектов")
    print(f"Папки с >99 объектами: {over if over else 'НЕТ — лимит соблюдён'}")
    print(f"Секреты/мусор внутри: {bad if bad else 'НЕТ'}")
    print(f"Отсутствуют ключевые файлы: {missing if missing else 'НЕТ — все на месте'}")
    tops = defaultdict(int)
    for n in names:
        tops[n.split("/")[0]] += 1
    print("Состав по папкам:", dict(sorted(tops.items(), key=lambda kv: -kv[1])))
    ok = not over and not bad and not missing
    print("ИТОГ:", "ГОТОВО ✔" if ok else "ЕСТЬ ПРОБЛЕМЫ ✘")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
