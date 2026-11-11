"""Render the 1120x630 catalog snippet from public/snippet.svg and verify."""
import cairosvg
from PIL import Image

SRC = "/home/z/my-project/public/snippet.svg"
OUT = "/home/z/my-project/download/snippet-1120x630.png"

cairosvg.svg2png(url=SRC, write_to=OUT, output_width=1120, output_height=630)

im = Image.open(OUT).convert("RGB")
assert im.size == (1120, 630), f"bad size {im.size}"
corner = im.getpixel((3, 3))

def gold_count(x0, y0, x1, y1):
    n = 0
    for y in range(y0, y1, 2):
        for x in range(x0, x1, 2):
            r, g, b = im.getpixel((x, y))
            if r > 180 and g > 140 and b < 130:
                n += 1
    return n

title_gold = gold_count(150, 80, 970, 170)      # title band
dome_gold = gold_count(430, 330, 690, 480)      # central dome
cross_gold = gold_count(490, 270, 630, 350)     # cross above dome
windows = gold_count(500, 515, 620, 555)        # glowing windows

print(f"size={im.size} corner={corner}")
print(f"title_gold={title_gold} dome_gold={dome_gold} cross_gold={cross_gold} windows={windows}")
ok = title_gold > 50 and dome_gold > 100 and cross_gold > 5 and windows > 5
print("OK" if ok else "FAIL")
