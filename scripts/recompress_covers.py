#!/usr/bin/env python3
"""Дожимает тяжёлые обложки до <=100 КБ (q72), сохраняя разрешение."""
import os
from PIL import Image

DST = "/home/z/my-project/public/images"
LIMIT = 100 * 1024

for name in ["temple-wooden", "temple-autumn", "lib-grove"]:
    p = os.path.join(DST, f"{name}.jpg")
    im = Image.open(p)
    w, h = im.size
    target = 800 if name != "lib-grove" else 720
    if w > target:
        im = im.resize((target, round(h * target / w)), Image.LANCZOS)
    q = 78
    while q >= 56:
        im.save(p, "JPEG", quality=q, optimize=True, progressive=True)
        if os.path.getsize(p) <= LIMIT:
            break
        q -= 4
    kb = os.path.getsize(p) / 1024
    print(f"{name}.jpg  q={q}  {kb:.0f} KB")

worst = max((os.path.getsize(os.path.join(DST, f)) for f in os.listdir(DST) if f.endswith(".jpg")))
print(f"Максимум по папке: {worst/1024:.0f} KB")
