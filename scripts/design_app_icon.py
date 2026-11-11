# -*- coding: utf-8 -*-
"""Светлые минималистичные варианты иконки приложения «Православные».

Гамма Antipa сохраняется (золото #E4B84C/#F9E29B + графит #2B3542),
но фон становится тёплым и светлым вместо тёмного графита.
Каждый вариант рендерится 640x640, из них собирается контакт-лист.
"""
import cairosvg
from PIL import Image, ImageDraw, ImageFont

ASSETS = "/home/z/my-project/assets/src"
SHEET = "/home/z/my-project/download/icon-variants-preview.png"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# ── Общая геометрия ──────────────────────────────────────────────
# Луковичный купол: широкие плечи, острый шпиль (центр x=288)
DOME = ("M288 176 C279 208 246 228 219 258 C190 290 178 322 190 350 "
        "C203 378 240 392 288 392 C336 392 373 378 386 350 "
        "C398 322 386 290 357 258 C330 228 297 208 288 176 Z")
DOME_HL_GOLD = ('<ellipse cx="248" cy="316" rx="20" ry="54" fill="#FFF3D0" opacity="0.38" '
                'transform="rotate(14 248 316)"/>'
                '<path d="M288 188 C284 244 284 322 288 382" stroke="#8A6212" '
                'stroke-opacity="0.22" stroke-width="3" fill="none"/>')
DOME_HL_INK = ('<ellipse cx="250" cy="316" rx="18" ry="50" fill="#FFFFFF" opacity="0.07" '
               'transform="rotate(14 250 316)"/>')

GRAD_DOME_GOLD = ('<linearGradient id="domeFill" x1="0" y1="0" x2="0" y2="1">'
                  '<stop offset="0" stop-color="#EAC96C"/>'
                  '<stop offset="0.5" stop-color="#D5A93F"/>'
                  '<stop offset="1" stop-color="#A87B1C"/></linearGradient>')
GRAD_DOME_INK = ('<linearGradient id="domeFill" x1="0" y1="0" x2="0" y2="1">'
                 '<stop offset="0" stop-color="#2E3947"/>'
                 '<stop offset="1" stop-color="#1A222D"/></linearGradient>')
GRAD_CROSS_GOLD = ('<linearGradient id="crossFill" x1="0" y1="0" x2="0" y2="1">'
                   '<stop offset="0" stop-color="#C79A2F"/>'
                   '<stop offset="1" stop-color="#8F6A15"/></linearGradient>')
GRAD_CROSS_INK = ('<linearGradient id="crossFill" x1="0" y1="0" x2="0" y2="1">'
                  '<stop offset="0" stop-color="#3A4656"/>'
                  '<stop offset="1" stop-color="#232D3A"/></linearGradient>')

# Восьмиконечный крест над куполом (канонический):
# табличка + средняя (самая широкая, прямая) + подножие у низа,
# приподнятый конец подножия — слева (благоразумный разбойник,
# распятый по правую руку Спасителя — его сторона для зрителя слева)
CROSS = (
    '<rect x="280" y="94" width="16" height="76" rx="3" fill="url(#crossFill)"/>'
    '<rect x="266" y="103" width="44" height="11" rx="3" fill="url(#crossFill)"/>'
    '<rect x="260" y="122" width="56" height="11" rx="3" fill="url(#crossFill)"/>'
    '<rect x="264" y="148" width="48" height="11" rx="3" fill="url(#crossFill)" '
    'transform="rotate(22 288 153.5)"/>'
)
# Большой крест (вариант «Только крест») — канонический восьмиконечный
BIG_CROSS = (
    '<rect x="272" y="96" width="32" height="376" rx="6" fill="url(#crossFill)"/>'
    '<rect x="212" y="214" width="152" height="22" rx="5" fill="url(#crossFill)"/>'
    '<rect x="188" y="246" width="200" height="24" rx="5" fill="url(#crossFill)"/>'
    '<rect x="204" y="352" width="168" height="22" rx="5" fill="url(#crossFill)" '
    'transform="rotate(24 288 363)"/>'
)

BG_PARCHMENT = ('<radialGradient id="bg" cx="50%" cy="36%" r="85%">'
                '<stop offset="0" stop-color="#FCF8EE"/>'
                '<stop offset="0.55" stop-color="#F3EAD3"/>'
                '<stop offset="1" stop-color="#E6D6B2"/></radialGradient>')
BG_DAWN = ('<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
           '<stop offset="0" stop-color="#DFEBF2"/>'
           '<stop offset="0.55" stop-color="#F5EFDF"/>'
           '<stop offset="1" stop-color="#EFE2C4"/></linearGradient>')
BG_GOLDFIELD = ('<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">'
                '<stop offset="0" stop-color="#F8ECC8"/>'
                '<stop offset="1" stop-color="#E9D092"/></linearGradient>')


def icon_svg(*, bg_defs, glow, dome_grad, dome_hl, cross_grad, base_fill, with_dome=True):
    content = [f'<ellipse cx="288" cy="296" rx="235" ry="200" fill="url(#glowFill)"/>']
    if with_dome:
        content.append(f'<path d="{DOME}" fill="url(#domeFill)"/>')
        content.append(f'<g clip-path="url(#domeClip)">{dome_hl}</g>')
        content.append(f'<rect x="212" y="400" width="152" height="15" rx="7" fill="{base_fill}"/>')
        content.append(CROSS)
    else:
        content.append(BIG_CROSS)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 576" width="576" height="576">
  <defs>
    {bg_defs}
    <radialGradient id="glowFill" cx="50%" cy="52%" r="55%">
      <stop offset="0" stop-color="#E4B84C" stop-opacity="{glow}"/>
      <stop offset="1" stop-color="#E4B84C" stop-opacity="0"/>
    </radialGradient>
    {dome_grad}
    {cross_grad}
    <clipPath id="domeClip"><path d="{DOME}"/></clipPath>
  </defs>
  <rect width="576" height="576" fill="url(#bg)"/>
  {''.join(content)}
</svg>'''


VARIANTS = {
    "a": {
        "title": "А · Пергамент — золото на светлом",
        "svg": icon_svg(bg_defs=BG_PARCHMENT, glow="0.10", dome_grad=GRAD_DOME_GOLD,
                        dome_hl=DOME_HL_GOLD, cross_grad=GRAD_CROSS_GOLD, base_fill="#2B3542"),
    },
    "b": {
        "title": "Б · Рассвет — небо и золото",
        "svg": icon_svg(bg_defs=BG_DAWN, glow="0.08", dome_grad=GRAD_DOME_GOLD,
                        dome_hl=DOME_HL_GOLD, cross_grad=GRAD_CROSS_INK, base_fill="#B8871F"),
    },
    "c": {
        "title": "В · Золото и тушь",
        "svg": icon_svg(bg_defs=BG_GOLDFIELD, glow="0.0", dome_grad=GRAD_DOME_INK,
                        dome_hl=DOME_HL_INK, cross_grad=GRAD_CROSS_INK, base_fill="#8F6A15"),
    },
    "d": {
        "title": "Г · Только крест",
        "svg": icon_svg(bg_defs=BG_PARCHMENT, glow="0.14", dome_grad=GRAD_DOME_GOLD,
                        dome_hl="", cross_grad=GRAD_CROSS_GOLD, base_fill=None, with_dome=False),
    },
}


def main():
    import os
    os.makedirs(ASSETS, exist_ok=True)
    cell, margin, gap, label_h, footer_h = 640, 36, 28, 60, 56
    cols, rows = 2, 2
    W = margin + cell * cols + gap * (cols - 1) + margin
    H = margin + rows * (cell + label_h) + (rows - 1) * gap + footer_h + margin
    sheet = Image.new("RGB", (W, H), "#141A22")
    draw = ImageDraw.Draw(sheet)
    f_title = ImageFont.truetype(FONT, 28)
    f_note = ImageFont.truetype(FONT, 21)

    keys = list(VARIANTS)
    for i, key in enumerate(keys):
        v = VARIANTS[key]
        svg_path = f"{ASSETS}/appicon-{key}.svg"
        png_path = f"{ASSETS}/appicon-{key}.png"
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(v["svg"])
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=cell, output_height=cell)
        im = Image.open(png_path).convert("RGB")
        col, row = i % cols, i // cols
        x = margin + col * (cell + gap)
        y = margin + row * (cell + label_h + gap)
        sheet.paste(im, (x, y))
        draw.text((x + 6, y + cell + 14), v["title"], font=f_title, fill="#F9E29B")
    draw.text((margin + 6, H - margin - 28),
              "Варианты иконки приложения «Православные» · золотая гамма Antipa на светлом фоне",
              font=f_note, fill="#8B96A5")
    sheet.save(SHEET, optimize=True)
    print(f"sheet: {SHEET} {sheet.size} {round(len(open(SHEET, 'rb').read()) / 1024)} KB")
    for key in keys:
        p = f"{ASSETS}/appicon-{key}.png"
        print(f"  {key}: {Image.open(p).size}, {round(len(open(p, 'rb').read()) / 1024)} KB")
    print("OK")


if __name__ == "__main__":
    main()
