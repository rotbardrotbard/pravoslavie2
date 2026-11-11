"""Reshoot the prayer screen: open 'Утреннее правило' so the frame is full."""
import re
import time

from PIL import Image
from playwright.sync_api import sync_playwright

OUT = "/home/z/my-project/download/screenshots/screenshot-3-prayer.png"

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 600, "height": 1200},
        device_scale_factor=2,
        locale="ru-RU",
        timezone_id="Europe/Moscow",
    )
    ctx.add_init_script('localStorage.setItem("pr.onboarded", "true");')
    page = ctx.new_page()
    page.goto("http://localhost:3000/", wait_until="domcontentloaded", timeout=90_000)
    page.get_by_text("Мир вам").first.wait_for(timeout=60_000)
    page.add_style_tag(content=(
        "nextjs-portal{display:none!important}"
        ".app-column{max-width:600px!important}"
    ))
    time.sleep(1.5)

    page.locator('[aria-label="Основная навигация"]').get_by_text(
        "Молитва", exact=True
    ).click()
    page.get_by_text("Молитвослов").first.wait_for(timeout=30_000)
    time.sleep(1.0)

    page.get_by_text("Утреннее правило").first.click()
    page.get_by_text("К правилу").first.wait_for(timeout=30_000)
    # advance until the longest prayer (Символ веры) is on screen
    for _ in range(8):
        if "Символ веры" in page.inner_text("body"):
            break
        page.get_by_role("button", name=re.compile(r"Дал")).first.click()
        time.sleep(0.7)
    time.sleep(1.5)

    page.screenshot(path="/tmp/shot_prayer_rule.png")
    browser.close()

im = Image.open("/tmp/shot_prayer_rule.png").convert("RGB")
assert im.size == (1200, 2400), im.size
im = im.resize((600, 1200), Image.LANCZOS)
im.save(OUT, optimize=True)
g = im.convert("L")
px = list(g.getdata())
print(f"resaved {OUT} mean_lum={sum(px)/len(px):.0f}")
