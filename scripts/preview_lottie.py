#!/usr/bin/env python3
"""Превью и верификация Lottie-иконки загрузки через lottie-web (chromium).
Снимаем кадры, проверяем движение и золотые пиксели, собираем GIF и контактный лист.
"""
import json
import os
import subprocess

from PIL import Image

PROJ = "/home/z/my-project"
LOTTIE = f"{PROJ}/download/loading-96x96.json"
TMP = "/tmp/lottie-preview"
os.makedirs(TMP, exist_ok=True)

# --- 1. lottie-web ------------------------------------------------------------
PLAYER = f"{TMP}/node_modules/lottie-web/build/player/lottie.min.js"
if not os.path.exists(PLAYER):
    subprocess.run(
        ["npm", "i", "--prefix", TMP, "lottie-web", "--no-audit", "--no-fund"],
        check=True, cwd=TMP, capture_output=True,
    )
print("lottie-web ready")

anim = json.load(open(LOTTIE))
html = f"""<!doctype html><html><head><meta charset="utf-8">
<style>body{{margin:0;background:#2a2e35;padding:0}}#c{{width:96px;height:96px}}</style></head>
<body><div id="c"></div>
<script src="node_modules/lottie-web/build/player/lottie.min.js"></script>
<script>
window.anim = lottie.loadAnimation({{container: document.getElementById('c'),
  renderer: 'svg', loop: true, autoplay: false,
  animationData: {json.dumps(anim)}}});
window.anim.addEventListener('DOMLoaded', function() {{ window.__ready = true; }});
</script></body></html>"""
open(f"{TMP}/preview.html", "w", encoding="utf-8").write(html)

# --- 2. съёмка кадров ---------------------------------------------------------
FRAMES = list(range(0, 90, 4))  # 23 кадра
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 220, "height": 220}, device_scale_factor=2)
    pg.goto(f"file://{TMP}/preview.html")
    pg.wait_for_function("window.__ready === true", timeout=15000)
    for f in FRAMES:
        pg.evaluate(f"window.anim.goToAndStop({f}, true)")
        pg.wait_for_timeout(60)
        pg.locator("#c").screenshot(path=f"{TMP}/frame_{f:02d}.png")
    b.close()

# --- 3. программная верификация ------------------------------------------------
hashes, gold_counts = [], []
for f in FRAMES:
    im = Image.open(f"{TMP}/frame_{f:02d}.png").convert("RGB")
    assert im.size == (192, 192), im.size
    hashes.append(im.tobytes())
    px = im.load()
    gold = sum(1 for x in range(0, 192, 2) for y in range(0, 192, 2)
               if (lambda r, g, b: r > 160 and g > 110 and b < 170 and r - b > 40)(*px[x, y]))
    gold_counts.append(gold)

unique = len(set(hashes))
print(f"кадров: {len(FRAMES)}, уникальных: {unique} (анимация движется: {unique > len(FRAMES) - 2})")
print(f"золотые пиксели (сэмпл): min={min(gold_counts)}, max={max(gold_counts)}")

# --- 4. GIF-превью -------------------------------------------------------------
frames96 = []
for f in FRAMES:
    im = Image.open(f"{TMP}/frame_{f:02d}.png").convert("RGBA")
    frames96.append(im.resize((96, 96), Image.LANCZOS))
gif_path = f"{PROJ}/download/loading-96x96-preview.gif"
frames96[0].save(gif_path, save_all=True, append_images=frames96[1:],
                 duration=67, loop=0, disposal=2)
print(f"GIF: {gif_path}  {os.path.getsize(gif_path)} bytes")

# --- 5. контактный лист (6 кадров, x2) ----------------------------------------
sheet_frames = [0, 12, 28, 44, 60, 76]
cell = 192 * 2
sheet = Image.new("RGB", (cell * 3 + 40, cell * 2 + 30), (235, 235, 235))
from PIL import ImageDraw, ImageFont
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
d = ImageDraw.Draw(sheet)
for i, f in enumerate(sheet_frames):
    im = Image.open(f"{TMP}/frame_{f:02d}.png").convert("RGBA").resize((cell, cell), Image.NEAREST)
    x = 10 + (i % 3) * (cell + 10)
    y = 10 + (i // 3) * (cell + 5)
    sheet.paste(im, (x, y), im)
    d.text((x + 8, y + 6), f"frame {f}", fill=(30, 30, 30), font=font)
sheet.save(f"{TMP}/sheet.png")
print(f"лист: {TMP}/sheet.png  {sheet.size}")
