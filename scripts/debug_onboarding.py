#!/usr/bin/env python3
"""Пошаговая трассировка онбординга v2 (aria-pressed + точные имена)."""
import re
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
CHIPS = ["Только начинаю", "Верю, хожу в храм редко", "Воцерковлён(а)",
         "Утренняя и вечерняя молитва", "Чтение Писания", "История, традиции, праздники",
         "Вопросы о вере", "Карта храмов и святынь рядом"]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 480, "height": 900})
    pg.goto(BASE, wait_until="domcontentloaded", timeout=45000)
    pg.wait_for_timeout(2500)
    for step in range(12):
        nav = pg.locator('nav[aria-label="Основная навигация"]').count()
        body = " ".join(pg.locator("body").inner_text().split())[:120]
        print(f"--- step {step} | nav={nav} | {body}")
        if nav:
            print("НАВ ПОЯВИЛАСЬ — ОК"); break
        act = None
        for pat in ("^Только начинаю", "^Верю, хожу в храм редко", "^Воцерковлён"):
            loc = pg.get_by_role("button", name=re.compile(pat))
            if loc.count():
                act = ("level", pat, loc.first); break
        if not act:
            for name in CHIPS[3:]:
                loc = pg.get_by_role("button", name=name, exact=True)
                if loc.count() and loc.first.get_attribute("aria-pressed") != "true":
                    act = ("chip", name, loc.first); break
        if not act:
            sn = pg.get_by_role("button", name=re.compile("— далее"))
            if sn.count() and sn.first.is_enabled():
                act = ("selnext", "— далее", sn.first)
        if not act:
            for name in ("Далее", "Начать"):
                loc = pg.get_by_role("button", name=name, exact=True)
                if loc.count():
                    print(f"    {name}: count={loc.count()} disabled={loc.first.is_disabled()}")
                    if loc.first.is_enabled():
                        act = ("nav", name, loc.first); break
        if not act:
            # дамп всех кнопок
            vis = pg.locator("button:visible")
            print("    КНОПКИ:", [(" ".join(vis.nth(i).inner_text().split())[:30], vis.nth(i).get_attribute("aria-pressed")) for i in range(min(vis.count(), 12))])
            print("    целей нет — стоп"); break
        kind, label, el = act
        print(f"    клик [{kind}] {label}")
        el.click()
        pg.wait_for_timeout(900)
    b.close()
