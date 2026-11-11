#!/usr/bin/env python3
"""Диагностика раздела «Евангелие»: сценарий Библиотека → Библия → чтение главы.
Запускается против указанного базового URL (Vercel или локальный dev)."""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://pravoslavie.vercel.app"
TAG = sys.argv[2] if len(sys.argv) > 2 else "vercel"

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 480, "height": 900})
    pg.on("console", lambda m: errors.append(f"[console.{m.type}] {m.text[:200]}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {str(e)[:300]}"))
    pg.add_init_script('localStorage.setItem("pr.onboarded", "true");')
    pg.goto(BASE, wait_until="networkidle", timeout=45000)
    pg.wait_for_timeout(1500)

    # 1. Открыть Библиотеку
    pg.get_by_role("button", name="Библиотека").first.click()
    pg.wait_for_timeout(1200)
    body = " ".join(pg.locator("body").inner_text().split())
    has_bible_tab = "Библия · Синодальный перевод" in body
    has_day = "Евангелие дня" in body
    print(f"1) Библиотека: вкладка Библия={has_bible_tab}, «Евангелие дня»={has_day}")
    pg.screenshot(path=f"/tmp/gospel_{TAG}_1_library.png")

    # 2. Открыть книгу «Евангелие от Марка» (nr=41) — отдельный чанк
    try:
        pg.get_by_role("button", name="Евангелие от Марка").first.click()
        pg.wait_for_timeout(2500)
        body2 = " ".join(pg.locator("body").inner_text().split())
        ok_text = ("глава 1" in body2.lower()) or ("Глава 1" in body2)
        snippet = body2[:400]
        print(f"2) Открытие Марка: глава 1 видна={ok_text}")
        print(f"   фрагмент: {snippet[:260]}")
        pg.screenshot(path=f"/tmp/gospel_{TAG}_2_reader.png")
    except Exception as e:
        print(f"2) ОШИБКА открытия книги: {str(e)[:200]}")
        pg.screenshot(path=f"/tmp/gospel_{TAG}_2_error.png")

    # 3. «Евангелие дня» (план чтения)
    try:
        pg.keyboard.press("Escape")
        pg.get_by_role("button", name="Библиотека").first.click()
        pg.wait_for_timeout(800)
        btn = pg.get_by_role("button", name=lambda n: n and "Читать главу" in n) if False else pg.locator("button", has_text="Читать главу").first
        btn.click()
        pg.wait_for_timeout(2500)
        body3 = " ".join(pg.locator("body").inner_text().split())
        print(f"3) Евангелие дня открыто: {body3[:200]}")
        pg.screenshot(path=f"/tmp/gospel_{TAG}_3_day.png")
    except Exception as e:
        print(f"3) ОШИБКА «Евангелие дня»: {str(e)[:200]}")

    b.close()

print("--- JS-ошибки страницы ---")
seen = set()
for e in errors:
    if e not in seen and "facebook" not in e.lower():
        seen.add(e)
        print(" ", e)
if not errors:
    print("  нет")
