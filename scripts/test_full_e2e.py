#!/usr/bin/env python3
import re
"""Полный e2e-обход «Православных» как тестировщик ОК: онбординг → все экраны →
читалки → консольные ошибки. Запуск: python3 scripts/test_full_e2e.py [BASE] [TAG]"""
import sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
TAG = sys.argv[2] if len(sys.argv) > 2 else "local"
SHOTS = "/tmp/e2e"

results: list[tuple[str, str]] = []   # (шаг, статус)
errors: list[str] = []                # консоль/страница

def rep(step: str, ok: bool, note: str = ""):
    results.append((step, ("OK " if ok else "FAIL") + (f" — {note}" if note else "")))
    print(("✔" if ok else "✖"), step, ("— " + note if note else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 480, "height": 900})
    pg.on("console", lambda m: errors.append(f"[console] {m.text[:180]}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[pageerror] {str(e)[:250]}"))

    # ── 0. Онбординг (свежий localStorage): кликабельность шагов ──
    try:
        pg.goto(BASE, wait_until="domcontentloaded", timeout=45000)
        pg.wait_for_timeout(2500)
        body = " ".join(pg.locator("body").inner_text().split())
        onb = any(w in body for w in ("Далее", "Начать", "Крещен", "воцерков", "правил"))
        rep("0. Онбординг открылся для нового пользователя", onb, body[:80])
        # проходим шаги: чипы (aria-pressed=false) → «— далее» → «Далее»/«Начать»
        import re as _re
        chip_labels = ["Только начинаю", "Верю, хожу в храм редко", "Воцерковлён(а)",
                       "Утренняя и вечерняя молитва", "Чтение Писания", "История, традиции, праздники",
                       "Вопросы о вере", "Карта храмов и святынь рядом"]
        nav_home = lambda: pg.locator('nav[aria-label="Основная навигация"]').count() > 0
        already = set()
        # уровневые кнопки содержат лейбл+подсказку → ищем по началу строки
        level_pats = ["^Только начинаю", "^Верю, хожу в храм редко", "^Воцерковлён"]
        for i in range(16):
            if nav_home():
                break
            clicked = False
            for pat in level_pats:
                if pat in already:
                    continue
                loc = pg.get_by_role("button", name=_re.compile(pat))
                if loc.count():
                    loc.first.click(); already.add(pat); clicked = True
                    pg.wait_for_timeout(400)
                    break
            if clicked:
                continue
            for name in chip_labels[3:]:
                if name in already:
                    continue
                loc = pg.get_by_role("button", name=name, exact=True)
                if loc.count() and loc.first.get_attribute("aria-pressed") != "true":
                    loc.first.click(); already.add(name); clicked = True
                    pg.wait_for_timeout(350)
                    break
            if clicked:
                continue
            sel_next = pg.get_by_role("button", name=_re.compile("— далее"))
            if sel_next.count() and sel_next.first.is_enabled():
                sel_next.first.click(); clicked = True
                pg.wait_for_timeout(600)
            if clicked:
                continue
            for name in ("Далее", "Начать", "Всё готово"):
                loc = pg.get_by_role("button", name=name, exact=True)
                if loc.count() and loc.first.is_enabled():
                    loc.first.click(); clicked = True
                    pg.wait_for_timeout(600)
                    break
            if not clicked:
                pg.wait_for_timeout(400)
        pg.wait_for_timeout(1200)
        home_now = nav_home()
        rep("0a. Онбординг прощёлкан (кликабельность), попали на «Дом»", home_now,
            "" if home_now else " ".join(pg.locator("body").inner_text().split())[:120])
        pg.screenshot(path=f"{SHOTS}_{TAG}_00_home.png")
    except Exception as e:
        rep("0. Онбординг", False, str(e)[:150])

    # дальше — с уже пройденным онбордингом
    pg.evaluate('localStorage.setItem("pr.onboarded","true")')

    def close_reader():
        for _ in range(2):
            try:
                cl = pg.get_by_role("button", name="Закрыть читалку")
                if cl.count():
                    cl.first.click()
                    pg.wait_for_timeout(700)
                    continue
            except Exception:
                pass
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(400)

    def nav(tab: str):
        pg.locator('nav[aria-label="Основная навигация"] button').filter(has_text=tab).first.click()
        pg.wait_for_timeout(1400)

    def bodytxt() -> str:
        return " ".join(pg.locator("body").inner_text().split())

    # ── 1. Дом ──
    try:
        nav("Дом")
        t = bodytxt()
        has_day = any(w in t for w in ("праздник", "День", "свят", "Сегодня")) or len(t) > 200
        rep("1. Дом: контент дня отображается", has_day, t[:110])
        pg.screenshot(path=f"{SHOTS}_{TAG}_01_home.png")
    except Exception as e:
        rep("1. Дом", False, str(e)[:150])

    # ── 2. Календарь: святые дня с описаниями + полное житие ──
    try:
        nav("Календарь")
        t = bodytxt()
        rep("2. Календарь открылся", "Календарь" in t or any(m in t for m in ("января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря")))
        pg.screenshot(path=f"{SHOTS}_{TAG}_02_calendar.png")
        # текущий день — если нет кнопки жития, идём на 19 декабря (свт. Николай — точно с lifeId)
        life_btn = pg.get_by_role("button", name="Житие")
        if not life_btn.count():
            pg.get_by_role("button", name="Следующий месяц").click()
            pg.wait_for_timeout(700)
            for _ in range(1):
                pass
            day19 = pg.locator('div.grid.grid-cols-7 button').filter(has_text=re.compile(r"^19"))
            if day19.count():
                day19.first.click()
                pg.wait_for_timeout(1000)
        life_btn = pg.get_by_role("button", name="Житие")
        n_life = life_btn.count()
        opened_life = False
        if n_life:
            life_btn.first.click()
            pg.wait_for_timeout(1800)
            t2 = bodytxt()
            opened_life = len(t2) > 700
            rep("2a. Полное житие открылось из святцев", opened_life, f"символов текста: {len(t2)}")
            pg.screenshot(path=f"{SHOTS}_{TAG}_02a_life.png")
            close_reader()
        else:
            rep("2a. Полное житие", False, "кнопка «Житие» не найдена даже на 19 декабря")
    except Exception as e:
        rep("2. Календарь", False, str(e)[:150])

    # ── 3. Молитва ──
    try:
        nav("Молитва")
        t = bodytxt()
        rep("3. Молитва: правило отображается", len(t) > 200, t[:90])
        # открыть первую молитву/правило
        for name in ("Утреннее правило", "Вечернее правило", "Отче наш", "Открыть"):
            loc = pg.get_by_role("button", name=name)
            if loc.count():
                loc.first.click(); pg.wait_for_timeout(1200)
                t2 = bodytxt()
                rep(f"3a. Открытие «{name}» — текст молитвы", len(t2) > 240, f"символов: {len(t2)}")
                pg.screenshot(path=f"{SHOTS}_{TAG}_03_prayer.png")
                otche = pg.get_by_role("button", name="Отче наш", exact=True)
                if otche.count():
                    otche.first.click()
                    pg.wait_for_timeout(1000)
                    t3 = bodytxt()
                    rep("3b. Отдельная молитва («Отче наш») — полный текст", len(t3) > 300, f"символов: {len(t3)}")
                    pg.screenshot(path=f"{SHOTS}_{TAG}_03b_prayer_text.png")
                    close_reader()
    except Exception as e:
        rep("3. Молитва", False, str(e)[:150])

    # ── 4. Библиотека ──
    try:
        nav("Библиотека")
        t = bodytxt()
        rep("4. Библиотека: «Евангелие дня»", "Евангелие дня" in t)
        rep("4a. Вкладка Библия", "Синодальный" in t or "Библия" in t)
        pg.screenshot(path=f"{SHOTS}_{TAG}_04_library.png")
        # Евангелие дня
        for name in ("Читать", "Евангелие дня"):
            loc = pg.get_by_role("button", name=name)
            if loc.count():
                loc.first.click(); pg.wait_for_timeout(1800)
                t2 = bodytxt()
                rep("4b. Евангелие дня — текст читается", len(t2) > 400, f"символов: {len(t2)}")
                pg.screenshot(path=f"{SHOTS}_{TAG}_04b_gospel.png")
                close_reader()
        # Библия: Марк, глава 1, листание
        pg.get_by_role("button", name="Евангелие от Марка").first.click()
        pg.wait_for_timeout(2200)
        t3 = bodytxt()
        rep("4c. Библия: Марк глава 1", "лава 1" in t3, f"символов: {len(t3)}")
        pg.screenshot(path=f"{SHOTS}_{TAG}_04c_bible.png")
        nxt = pg.get_by_role("button", name="Глава 2")
        if not nxt.count(): nxt = pg.get_by_role("button", name="→")
        if nxt.count():
            nxt.first.click(); pg.wait_for_timeout(1500)
            rep("4d. Листание главы (→ 2)", "лава 2" in bodytxt())
        close_reader()
    except Exception as e:
        rep("4. Библиотека", False, str(e)[:180])

    # ── 5. Отцы и Ответы (вкладки библиотеки) ──
    try:
        nav("Библиотека")
        for tab, marker in (("Отцы", None), ("Ответы", None), ("Жития", None)):
            loc = pg.get_by_role("button", name=tab)
            if not loc.count():
                continue
            loc.first.click(); pg.wait_for_timeout(1300)
            t = bodytxt()
            rep(f"5. Вкладка «{tab}» открывается с контентом", len(t) > 250, t[:80])
            pg.screenshot(path=f"{SHOTS}_{TAG}_05_{tab}.png")
    except Exception as e:
        rep("5. Вкладки библиотеки", False, str(e)[:150])

    # ── 6. Карта ──
    try:
        nav("Карта")
        pg.wait_for_timeout(2500)
        leaflet = pg.locator(".leaflet-container").count() > 0 or pg.locator(".leaflet-tile").count() > 0
        rep("6. Карта: Leaflet инициализировался", leaflet)
        pg.screenshot(path=f"{SHOTS}_{TAG}_06_map.png")
    except Exception as e:
        rep("6. Карта", False, str(e)[:150])

    # ── 7. Ещё ──
    try:
        nav("Ещё")
        t = bodytxt()
        rep("7. «Ещё»: меню открывается", len(t) > 150, t[:90])
        pg.screenshot(path=f"{SHOTS}_{TAG}_07_more.png")
    except Exception as e:
        rep("7. Ещё", False, str(e)[:150])

    b.close()

fails = [r for r in results if r[1].startswith("FAIL")]
print("\n──────── ОТЧЁТ ────────")
for s, st in results:
    print(f"{st:55s} | {s}")
print(f"\nИТОГ: {len(results) - len(fails)}/{len(results)} проверок пройдено")
if errors:
    print(f"Консольных ошибок: {len(errors)}")
    for e in errors[:10]:
        print("  •", e)
else:
    print("Консольных ошибок: 0")
sys.exit(1 if fails or errors else 0)
