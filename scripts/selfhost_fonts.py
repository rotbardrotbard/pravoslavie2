"""Самохостинг шрифтов: скачиваем woff2 (cyrillic+latin) с Google Fonts
и генерируем @font-face с локальными путями."""
import re
import urllib.request
from pathlib import Path

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
CSS_URL = ("https://fonts.googleapis.com/css2?"
           "family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500"
           "&family=Golos+Text:wght@400;500;600;700&display=swap")

OUT_DIR = Path("/home/z/my-project/public/fonts")
CSS_OUT = Path("/home/z/my-project/src/app/fonts.css")
KEEP_SUBSETS = {"cyrillic", "latin"}

req = urllib.request.Request(CSS_URL, headers={"User-Agent": UA})
css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

# разбиваем на блоки: комментарий-подсетка + @font-face
blocks = re.findall(r"/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{[^}]+\})", css)
print(f"блоков @font-face: {len(blocks)}")

OUT_DIR.mkdir(parents=True, exist_ok=True)
rules = []
seen = set()
for subset, block in blocks:
    if subset not in KEEP_SUBSETS:
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    style = re.search(r"font-style:\s*(\w+)", block).group(1)
    weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
    urange = re.search(r"unicode-range:\s*([^;]+);", block).group(1).strip()

    slug = fam.lower().replace(" ", "-")
    fname = f"{slug}-{weight}-{style}-{subset}.woff2"
    if fname in seen:
        continue
    seen.add(fname)

    dest = OUT_DIR / fname
    if not dest.exists() or dest.stat().st_size == 0:
        r2 = urllib.request.Request(url, headers={"User-Agent": UA})
        dest.write_bytes(urllib.request.urlopen(r2, timeout=30).read())
    size = dest.stat().st_size
    print(f"  {fname}  {size//1024} КБ")

    rules.append(
        f"@font-face {{\n  font-family: '{fam}';\n  font-style: {style};\n"
        f"  font-weight: {weight};\n  font-display: swap;\n"
        f"  src: url('/fonts/{fname}') format('woff2');\n"
        f"  unicode-range: {urange};\n}}"
    )

CSS_OUT.write_text(
    "/* ═══════════════════════════════════════════════════════════\n"
    "   Самохостинг шрифтов (Cormorant Garamond, Golos Text).\n"
    "   Внешние запросы к fonts.googleapis.com/gstatic.com убраны:\n"
    "   в сетях, где Google подвисает, блокирующий <link> давал\n"
    "   долгий белый экран. Файлы лежат в /public/fonts, подгружаются\n"
    "   только нужные подмножества (cyrillic/latin), font-display: swap.\n"
    "   ═══════════════════════════════════════════════════════════ */\n\n"
    + "\n\n".join(rules) + "\n",
    encoding="utf-8",
)
print(f"\nCSS: {CSS_OUT} ({len(rules)} правил)")
total = sum(f.stat().st_size for f in OUT_DIR.glob('*.woff2'))
print(f"всего шрифтов: {len(list(OUT_DIR.glob('*.woff2')))}, {total//1024} КБ")
