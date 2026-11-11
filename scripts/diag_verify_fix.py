"""Проверка фикса на ЛОКАЛЬНОМ прод-билде: те же битые данные, что валили прод."""
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:3111/"

CASES = {
    "prayerLog строка":  {"pr.onboarded": "true", "pr.prayerLog": '"2026-11-01"'},
    "likedVerses карта": {"pr.onboarded": "true", "pr.likedVerses": '{"40:5": true}'},
    "всё битое сразу": {
        "pr.onboarded": "true",
        "pr.prayerLog": '"2026-11-01"',
        "pr.likedVerses": '{"40:5": true, "40:36": "yes"}',
        "pr.interests": '"prayer"',
        "pr.visitedTemples": '"s1"',
        "pr.fontBig": "true",
        "pr.bookmarks": '"мусор"',
        "pr.profile": '"Иван"',
    },
}

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ok_all = True
        for name, seed in CASES.items():
            ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
            calls = ";".join(f"window.localStorage.setItem('{k}','{v}')" for k, v in seed.items())
            await ctx.add_init_script(calls)
            page = await ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)[:300]))
            await page.goto(URL, wait_until="networkidle", timeout=30000)
            await page.wait_for_timeout(2500)
            txt = (await page.inner_text("body"))[:260].replace("\n", " | ")
            crashed = "Application error" in txt or bool(errs)
            status = "ПАДАЕТ ✗" if crashed else "работает ✓"
            if crashed: ok_all = False
            print(f"[{name}]\n  {status}  ошибки: {errs if errs else 'нет'}\n  текст: {txt[:200]}")
            await page.screenshot(path=f"/tmp/fix-{list(CASES).index(name)}.png")
            await ctx.close()

        # Прогрев: обычный чистый визит тоже жив
        ctx = await browser.new_context(viewport={"width": 412, "height": 915})
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)
        t = (await page.inner_text("body"))[:120].replace("\n", " ")
        print(f"\n[чистый визит] {'ок ✓' if t.strip() else 'пусто ✗'}: {t[:100]}")
        await browser.close()
        print("\nИТОГ:", "ФИКС РАБОТАЕТ" if ok_all else "ЕСТЬ ПАДЕНИЯ")

asyncio.run(run())
