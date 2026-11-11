#!/usr/bin/env python3
"""Проверка: приложение корректно рендерится внутри кросс-доменного iframe
(имитация того, как ОК встраивает мини-апп) + сбор console-ошибок."""
from playwright.sync_api import sync_playwright

WRAPPER = "/tmp/iframe_test/index.html"
import os, sys
os.makedirs("/tmp/iframe_test", exist_ok=True)
BASE = sys.argv[1] if len(sys.argv) > 1 else "https://pravoslavie.vercel.app"
open(WRAPPER, "w").write('<!doctype html><html><head><meta charset="utf-8">'
    '<style>body{margin:0}iframe{width:480px;height:900px;border:1px solid #ccc}</style>'
    '</head><body><iframe src="' + BASE + '/"></iframe></body></html>')
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 640, "height": 1050}, device_scale_factor=1)
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("file:///tmp/iframe_test/index.html")
    pg.wait_for_timeout(9000)
    frame = next((f for f in pg.frames if f != pg.main_frame and not f.url.startswith("about:") and not f.url.startswith("file:")), None)
    if frame:
        txt = ""
        try:
            txt = frame.locator("body").inner_text(timeout=5000)
        except Exception as ex:
            txt = f"(ошибка чтения: {ex})"
        head = " ".join(txt.split())[:220]
        print("URL фрейма:", frame.url[:80])
        print("Текст внутри iframe:", head if head else "(пусто!)")
    else:
        print("iframe с приложением НЕ найден")
    pg.screenshot(path="/tmp/iframe_test/shot.png")
    b.close()

print("JS-ошибки:", errors[:6] if errors else "нет")
