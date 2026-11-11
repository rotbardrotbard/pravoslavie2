"""Тест: все ключи localStorage (старые форматы) + мобильный UA/viewport"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://pravoslavie.vercel.app/"

SEED = {
    # онбординг
    "pr.onboarded": "true",
    "pr.level": '"beginner"',
    "pr.interests": '["saints","prayer"]',
    "pr.interest": '"prayer"',          # legacy
    "pr.geo": '"Москва"',
    "pr.notif": "true",
    "pr.evening": "true",               # legacy тёмная тема
    "pr.theme": '"dark"',
    # масштаб: СТАРЫЙ формат (fontBig boolean, без textScale)
    "pr.fontBig": "true",
    # данные с «неправильными»/старыми форматами
    "pr.prayerLog": '"2026-11-01"',      # строка вместо массива!
    "pr.likedVerses": '{"40:5": true}',  # объект вместо массива!
    "pr.visitedTemples": '[1,2,3]',
    "pr.readPlan": '[{"day":"2026-11-05","done":true}]',
    "pr.anonId": '"a123abc"',
    "pr.userName": '"Иван"',
    "pr.profile": '"Иван"',              # строка вместо объекта!
    "pr.bookmarks": '[{"key":"bible:40:5:3","kind":"bible","title":"Мк 5:36","snippet":"...","createdAt":1}]',
    "pr.readPos": '[]',                  # массив вместо объекта!
}

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 13; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36",
        )
        script = "window.localStorage.setItem(%s);" % ",".join(
            f"JSON.stringify('{k}'),'{v}'" for k, v in SEED.items()
        )
        # корректная сборка setItem-вызовов
        calls = ";".join(
            f"window.localStorage.setItem('{k}','{v}')" for k, v in SEED.items()
        )
        await ctx.add_init_script(calls)

        page = await ctx.new_page()
        errs, console = [], []
        page.on("pageerror", lambda e: errs.append(str(e)[:1000]))
        page.on("console", lambda m: console.append((m.type, m.text[:500])) if m.type in ("error", "warning") else None)

        await page.goto(URL, wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(3500)

        txt = (await page.inner_text("body"))[:500].replace("\n", " | ")
        fs = await page.evaluate("document.documentElement.style.fontSize")
        print("=== PAGE ERRORS ===")
        for e in errs: print(e, "\n")
        print("=== CONSOLE err/warn ===")
        for t, m in console: print(f"[{t}] {m}\n")
        print("=== ВИДИМЫЙ ТЕКСТ ===")
        print(txt if txt.strip() else "(ПУСТО — белый экран)")
        print("font-size html:", fs)
        await page.screenshot(path="/tmp/diag-seed-old.png")

        # reload поверх этих же данных
        await page.reload(wait_until="networkidle", timeout=45000)
        await page.wait_for_timeout(2500)
        txt2 = (await page.inner_text("body"))[:300].replace("\n", " | ")
        print("\n=== ПОСЛЕ RELOAD ===")
        print(txt2 if txt2.strip() else "(ПУСТО — белый экран)")
        print("Ошибки после reload:", errs[-3:] if errs else "нет")
        await browser.close()

asyncio.run(run())
