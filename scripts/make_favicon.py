"""Build favicon 32x32 (PNG + multi-size ICO) from a light minimalist dome design."""
import cairosvg
from PIL import Image

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <radialGradient id="bg" cx="50%" cy="36%" r="85%">
      <stop offset="0" stop-color="#FCF8EE"/>
      <stop offset="0.6" stop-color="#F3EAD3"/>
      <stop offset="1" stop-color="#E6D6B2"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#EAC96C"/>
      <stop offset="0.5" stop-color="#D5A93F"/>
      <stop offset="1" stop-color="#A87B1C"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#bg)"/>
  <ellipse cx="16" cy="17" rx="13" ry="11" fill="#E4B84C" opacity="0.10"/>
  <rect x="15.2" y="4.2" width="1.7" height="8.2" rx="0.8" fill="#A87B1C"/>
  <rect x="11.6" y="6.6" width="8.8" height="1.7" rx="0.8" fill="#A87B1C"/>
  <path d="M16 11.2 C15.5 12.8 13 14.1 11.5 16 C10 17.9 9.4 20 10.2 21.8 C11.1 23.8 13.2 24.8 16 24.8 C18.8 24.8 20.9 23.8 21.8 21.8 C22.6 20 22 17.9 20.5 16 C19 14.1 16.5 12.8 16 11.2 Z" fill="url(#gold)"/>
  <ellipse cx="13.4" cy="19.4" rx="1.6" ry="3.2" fill="#FFF3D0" opacity="0.45" transform="rotate(14 13.4 19.4)"/>
  <rect x="11" y="26.2" width="10" height="1.6" rx="0.8" fill="#2B3542"/>
</svg>"""

RAW = "/tmp/favicon_128.png"
cairosvg.svg2png(bytestring=SVG.encode(), write_to=RAW, output_width=128, output_height=128)

src = Image.open(RAW).convert("RGBA")

# PNG 32x32 (deliverable + public)
png32 = src.resize((32, 32), Image.LANCZOS)
png32.save("/home/z/my-project/download/favicon-32.png", optimize=True)
png32.save("/home/z/my-project/public/favicon-32.png", optimize=True)

# multi-size ICO from a 64px intermediate (better downscale for 16/32)
base64px = src.resize((64, 64), Image.LANCZOS)
base64px.save(
    "/home/z/my-project/public/favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
base64px.save("/home/z/my-project/download/favicon.ico", format="ICO",
              sizes=[(16, 16), (32, 32), (48, 48)])

# verify
for path, size in [
    ("/home/z/my-project/download/favicon-32.png", (32, 32)),
]:
    im = Image.open(path)
    assert im.size == size, (path, im.size)
im32 = png32.convert("RGBA")
gold = sum(
    1
    for y in range(10, 26)
    for x in range(8, 24)
    if (lambda p: p[0] > 150 and p[1] > 110 and p[2] < 160 and p[0] - p[2] > 30)(im32.getpixel((x, y)))
)
corner_alpha = im32.getpixel((0, 0))[3]
print(f"favicon-32.png: {png32.size}, gold_px={gold}, corner_alpha={corner_alpha} (0 = transparent rounded corner)")
ico = Image.open("/home/z/my-project/public/favicon.ico")
print("ico sizes:", ico.info.get("sizes", "n/a"), "base:", ico.size)
print("OK")
