# -*- coding: utf-8 -*-
"""Полный пакет «всё одним архивом»: код для GitHub + иконки для ОК/VK
+ фавиконки + превью вариантов + краткая шпаргалка."""
import os
import zipfile

DL = "/home/z/my-project/download"
OUT = f"{DL}/pravoslavnye-all-in-one.zip"
VER = "e6793ce"

README = f"""ПРАВОСЛАВНЫЕ — полный пакет одним архивом (версия кода {VER})
================================================================

СОДЕРЖИМОЕ:
1. pravoslavnye-github-novyj-repo.zip — весь код проекта для GitHub -> Vercel
   (внутри него подробная ИНСТРУКЦИЯ-НОВЫЙ-РЕПО.txt)
2. icon-278.png  — иконка приложения для настроек ОК (278x278)
3. icon-576.png  — иконка для VK Mini Apps (576x576)
4. favicon.ico, favicon-32.png — фавиконки (уже внутри кода, здесь для удобства)
5. icon-variants-preview.png — контакт-лист из 4 вариантов иконки
   (если захотите другой вариант — А/Б/В/Г — просто назовите букву)

ЧТО ДЕЛАТЬ:
ШАГ 1. Распакуйте pravoslavnye-github-novyj-repo.zip и загрузите в репозиторий
       GitHub СОДЕРЖИМОЕ архива (файлы и папки), а не сам zip — иначе Vercel
       не сможет собрать проект. Инструкция по шагам внутри.
ШАГ 2. Vercel подключён к репозиторию соберёт новую версию автоматически.
       Рабочая версия: https://pravoslavie.vercel.app
ШАГ 3. В настройках приложения ОК обновите иконку: icon-278.png.
       Приложение: https://ok.ru/app/512005604973
ШАГ 4. Если в старом репозитории остался файл .env — удалите его оттуда
       (секреты в репозитории хранить нельзя).

Версия {VER}: светлая минималистичная иконка приложения, убраны
шаблонные logo.svg и z-ai-web-dev-sdk; ранее — обложки библиотеки
(иконописные образы святых и книги), обложки цитат отцов, пакеты А/Б/В.
"""

files = [
    f"{DL}/pravoslavnye-github-novyj-repo.zip",
    f"{DL}/icon-278.png",
    f"{DL}/icon-576.png",
    f"{DL}/favicon.ico",
    f"{DL}/favicon-32.png",
    f"{DL}/icon-variants-preview.png",
]

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.writestr("ЧТО-ДЕЛАТЬ.txt", README)
    for p in files:
        assert os.path.isfile(p), f"нет файла: {p}"
        z.write(p, os.path.basename(p))

# ── проверка ──
with zipfile.ZipFile(OUT) as z:
    bad = z.testzip()
    assert bad is None, f"повреждён: {bad}"
    print("Содержимое пакета:")
    for i in z.infolist():
        print(f"  {i.filename:42s} {i.file_size/1024:9.1f} KB -> {i.compress_size/1024:9.1f} KB")
size = os.path.getsize(OUT)
print(f"\nИТОГ: {OUT}")
print(f"Размер: {size/1024/1024:.1f} МБ, целостность OK")
