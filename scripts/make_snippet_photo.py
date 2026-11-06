"""Build the 1120x630 catalog snippet from a real photo (Unsplash golden dome).

Layout: golden dome + cross in the upper frame against the sky,
app title/divider/tagline at the bottom over a deep dark gradient.
"""
import base64
import io

import sys

import cairosvg
from PIL import Image, ImageEnhance

SRC_PHOTO = "/tmp/cand_3.jpg"
OUT = "/home/z/my-project/download/snippet-1120x630.png"

W, H = 1120, 630

Y0 = int(sys.argv[1]) if len(sys.argv) > 1 else 800
im = Image.open(SRC_PHOTO).convert("RGB")
fw, fh = im.size
crop_w = fw                        # 3000
crop_h = round(crop_w * H / W)     # 1687 (16:9)
x0 = 0
y0 = max(min(Y0, fh - crop_h), 0)  # cross tip fully in frame
im = im.crop((x0, y0, x0 + crop_w, y0 + crop_h))
print(f"crop: x{x0} y{y0} {crop_w}x{crop_h}")

# ── 2. tone: deepen to match the dark brand palette ────────────────────────
im = im.resize((W, H), Image.LANCZOS)
im = ImageEnhance.Color(im).enhance(0.97)
im = ImageEnhance.Brightness(im).enhance(0.90)
im = ImageEnhance.Contrast(im).enhance(1.06)

# ── 3. overlay SVG ─────────────────────────────────────────────────────────
buf = io.BytesIO()
im.save(buf, format="JPEG", quality=88)
b64 = base64.b64encode(buf.getvalue()).decode("ascii")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <radialGradient id="vig" cx="50%" cy="42%" r="78%">
      <stop offset="0" stop-color="#0B0F15" stop-opacity="0"/>
      <stop offset="0.62" stop-color="#0B0F15" stop-opacity="0"/>
      <stop offset="1" stop-color="#0B0F15" stop-opacity="0.8"/>
    </radialGradient>
    <linearGradient id="topg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0D1219" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0D1219" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="botg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0C1117" stop-opacity="0"/>
      <stop offset="0.42" stop-color="#0C1117" stop-opacity="0.62"/>
      <stop offset="0.78" stop-color="#0C1117" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#0C1117" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="goldTitle" x1="0" y1="460" x2="0" y2="556" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7E08E"/>
      <stop offset="0.6" stop-color="#E4B84C"/>
      <stop offset="1" stop-color="#C79A2E"/>
    </linearGradient>
    <linearGradient id="goldCross" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FBE7A6"/>
      <stop offset="1" stop-color="#D9A93C"/>
    </linearGradient>
  </defs>

  <image xlink:href="data:image/jpeg;base64,{b64}" x="0" y="0" width="{W}" height="{H}"/>
  <rect width="{W}" height="{H}" fill="#1A2230" opacity="0.12"/>
  <rect width="{W}" height="{H}" fill="url(#vig)"/>
  <rect x="0" y="0" width="{W}" height="170" fill="url(#topg)"/>
  <rect x="0" y="360" width="{W}" height="270" fill="url(#botg)"/>

  <text x="560" y="548" text-anchor="middle" font-family="Liberation Serif" font-weight="bold"
        font-size="96" letter-spacing="3" fill="#000000" opacity="0.6">ПРАВОСЛАВНЫЕ</text>
  <text x="560" y="545" text-anchor="middle" font-family="Liberation Serif" font-weight="bold"
        font-size="96" letter-spacing="3" fill="url(#goldTitle)">ПРАВОСЛАВНЫЕ</text>

  <rect x="336" y="577" width="200" height="4" rx="2" fill="#C79A2E" opacity="0.8"/>
  <rect x="584" y="577" width="200" height="4" rx="2" fill="#C79A2E" opacity="0.8"/>
  <rect x="557.5" y="561" width="5" height="36" rx="2" fill="url(#goldCross)"/>
  <rect x="552" y="567" width="16" height="5" rx="2" fill="url(#goldCross)"/>
  <rect x="547" y="574" width="26" height="6" rx="2" fill="url(#goldCross)"/>

  <text x="560" y="618" text-anchor="middle" font-family="DejaVu Sans" font-size="27"
        fill="#DCE3EC">Календарь и святцы · Молитвослов · Библия · Карта храмов</text>
</svg>
'''
cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=OUT,
                 output_width=W, output_height=H)

# ── 4. verify ──────────────────────────────────────────────────────────────
res = Image.open(OUT).convert("RGB")
assert res.size == (W, H), res.size

def gold_count(x0_, y0_, x1_, y1_):
    c = 0
    for yy in range(y0_, y1_, 2):
        for xx in range(x0_, x1_, 2):
            r, g, b = res.getpixel((xx, yy))
            if r > 160 and g > 120 and b < 150 and r - b > 30:
                c += 1
    return c

print("cross_zone_gold (photo, top):", gold_count(480, 10, 640, 260))
print("dome_gold (photo, middle):", gold_count(300, 260, 820, 460))
# luminance under the title (contrast check)
import statistics
lum = []
for yy in range(470, 560, 4):
    for xx in range(150, 970, 12):
        r, g, b = res.getpixel((xx, yy))
        lum.append(0.2126 * r + 0.7152 * g + 0.0722 * b)
print(f"title_bg_luminance: median={statistics.median(lum):.0f} p90={sorted(lum)[int(len(lum)*0.9)]:.0f}")
print("title_zone_dark_bg:", res.getpixel((80, 520)), res.getpixel((1040, 520)))
print("corner:", res.getpixel((3, 3)), res.getpixel((W - 4, H - 4)))
print("saved:", OUT)
