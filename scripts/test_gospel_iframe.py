#!/usr/bin/env python3
"""Диагностика Евангелия внутри iframe (имитация окружения ОК)."""
from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 640, "height": 1000})
    pg.on("console", lambda m: errors.append(f"[{m.type}] {m.text[:200]}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {str(e)[:300]}"))
    pg.add_init_script('localStorage.setItem("pr.onboarded", "true");')
    pg.goto("file:///tmp/iframe_test/index.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(6000)

    frame = next((f for f in pg.frames if "pravoslavie" in f.url), None)
    if not frame:
        print("iframe не найден")
        raise SystemExit

    # 1. Библиотека
    frame.get_by_role("button", name="Библиотека").first.click()
    pg.wait_for_timeout(1500)
    # 2. Евангелие от Марка
    frame.get_by_role("button", name="Евангелие от Марка").first.click()
    pg.wait_for_timeout(3000)
    txt = " ".join(frame.locator("body").inner_text().split())
    i = txt.find("Евангелие от Марка Синодальный")
    print("Ридер внутри iframe:", txt[i:i+180] if i >= 0 else "(заголовок ридера не найден)")
    print("Стихи загрузились:", "Начало Евангелия Иисуса Христа" in txt)
    pg.screenshot(path="/tmp/gospel_iframe.png")

    # 3. Закрыть ридер и открыть «Евангелие дня» (кнопка «Читать главу Ин. N»)
    try:
        frame.get_by_role("button", name="Назад").first.click()
        pg.wait_for_timeout(1000)
    except Exception:
        pass
    try:
        frame.locator("button", has_text="Читать главу").first.click()
        pg.wait_for_timeout(3000)
        txt2 = " ".join(frame.locator("body").inner_text().split())
        j = txt2.find("Синодальный перевод · глава")
        print("«Евангелие дня» внутри iframe:", txt2[max(0, j-60):j+80] if j >= 0 else "(не открылось)")
    except Exception as e:
        print("Ошибка «Евангелие дня»:", str(e)[:150])

    b.close()

print("--- JS-ошибки ---")
for e in errors[:8]:
    print(" ", e)
if not errors:
    print("  нет")
