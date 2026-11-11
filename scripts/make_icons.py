"""Render app icons (576x576 for VK, 278x278 for OK) from public/icon.svg."""
import cairosvg
from PIL import Image

SRC = "/home/z/my-project/public/icon.svg"
OUT = [
    ("/home/z/my-project/download/icon-576.png", 576),
    ("/home/z/my-project/download/icon-278.png", 278),
]

for path, size in OUT:
    cairosvg.svg2png(url=SRC, write_to=path, output_width=size, output_height=size)

# --- verification ---
gold_px = {}
for path, size in OUT:
    im = Image.open(path).convert("RGB")
    assert im.size == (size, size), f"bad size: {im.size}"
    corner = im.getpixel((2, 2))
    center = im.getpixel((size // 2, int(size * 0.62)))  # dome body area
    # count "golden" pixels (r>170, g>120, b<120) in the dome area
    n_gold = 0
    for y in range(int(size * 0.30), int(size * 0.75)):
        for x in range(int(size * 0.25), int(size * 0.75)):
            r, g, b = im.getpixel((x, y))
            if r > 170 and g > 120 and b < 130:
                n_gold += 1
    total = (int(size * 0.75) - int(size * 0.30)) * (int(size * 0.75) - int(size * 0.25))
    gold_px[size] = (n_gold, total, round(100 * n_gold / total, 1))
    print(f"{path}: {size}x{size} corner={corner} dome_px={center} gold={gold_px[size][0]}px ({gold_px[size][2]}%)")

print("OK: both icons rendered, gold dome present" if all(v[0] > 0 for v in gold_px.values()) else "FAIL")
