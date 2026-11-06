"""Take 5 real screenshots (600x1200) of the mini-app screens via Playwright.

Screens: home, calendar, prayer, library, map.
Raw shots are captured at device_scale_factor=2 (1200x2400), then downscaled.
"""
import os
import time

from PIL import Image
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000/"
OUT_DIR = "/home/z/my-project/download/screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

SHOTS = [
    ("home", None, "Мир вам"),
    ("calendar", "Календарь", "Календарь и святцы"),
    ("prayer", "Молитва", "Молитвослов"),
    ("library", "Библиотека", "Библиотека"),
    ("map", "Карта", "Храмы рядом"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 600, "height": 1200},
        device_scale_factor=2,
        locale="ru-RU",
        timezone_id="Europe/Moscow",
    )
    # skip onboarding exactly like a returning user
    ctx.add_init_script('localStorage.setItem("pr.onboarded", "true");')
    page = ctx.new_page()

    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=90_000)
    page.get_by_text("Мир вам").first.wait_for(timeout=60_000)
    # app fills the whole 600px width; hide Next.js dev indicator
    page.add_style_tag(content=(
        "nextjs-portal{display:none!important}"
        ".app-column{max-width:600px!important}"
    ))
    time.sleep(2.0)

    raw = {}
    for i, (sid, nav_label, wait_text) in enumerate(SHOTS, 1):
        if nav_label:
            page.locator('[aria-label="Основная навигация"]').get_by_text(
                nav_label, exact=True
            ).click()
        page.get_by_text(wait_text).first.wait_for(timeout=30_000)
        time.sleep(4.0 if sid == "map" else 1.5)
        path = f"/tmp/shot_{sid}.png"
        page.screenshot(path=path)
        raw[sid] = path
        print(f"[{i}/5] captured: {sid}")

    browser.close()

# downscale 1200x2400 -> 600x1200
names = {
    "home": "screenshot-1-home.png",
    "calendar": "screenshot-2-calendar.png",
    "prayer": "screenshot-3-prayer.png",
    "library": "screenshot-4-library.png",
    "map": "screenshot-5-map.png",
}
for sid, fname in names.items():
    im = Image.open(raw[sid]).convert("RGB")
    assert im.size == (1200, 2400), f"{sid}: unexpected raw size {im.size}"
    im = im.resize((600, 1200), Image.LANCZOS)
    out = os.path.join(OUT_DIR, fname)
    im.save(out, optimize=True)
    # brightness sanity: screen should not be blank-white or blank-black
    g = im.convert("L")
    px = list(g.getdata())
    mean = sum(px) / len(px)
    print(f"{fname}: 600x1200 mean_lum={mean:.0f}")
print("DONE")
