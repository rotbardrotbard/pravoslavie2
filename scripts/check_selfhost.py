"""Проверка: самохостинг шрифтов + boot-fallback + версия в «Ещё»."""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3111"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
        await ctx.add_init_script("window.localStorage.setItem('pr.onboarded','true');window.localStorage.setItem('pr.textScale','115');")
        page = await ctx.new_page()
        external, font_reqs = [], []
        page.on("request", lambda r: external.append(r.url) if ("google" in r.url or "gstatic" in r.url) else None)
        page.on("request", lambda r: font_reqs.append(r.url) if ("/fonts/" in r.url) else None)
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:200]))

        await page.goto(BASE + "/", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(6000)  # больше таймера fallback (5с)

        boot_visible = await page.evaluate("getComputedStyle(document.getElementById('pr-boot')).display !== 'none'")
        ff = await page.evaluate("getComputedStyle(document.querySelector('.pr-display') || document.body).fontFamily")
        print("1. Запросы к Google/gstatic:", len(external), external[:2] if external else "— чисто ✓")
        print("2. Локальные шрифты запрошены:", len(font_reqs), "файлов")
        print("3. Boot-fallback виден:", boot_visible, "(должно быть False)")
        print("4. Шрифт заголовка:", ff[:60])
        print("5. Ошибки страницы:", errs if errs else "нет")
        await page.screenshot(path="/tmp/check-fonts.png")

        # «Ещё» -> версия
        nav = page.locator('[aria-label="Основная навигация"]')
        await nav.get_by_text("Ещё", exact=True).click(timeout=5000)
        await page.wait_for_timeout(1200)
        body = await page.inner_text("body")
        has_ver = "версия 1.5.0" in body
        print("6. Версия в «Ещё»:", "есть ✓" if has_ver else "НЕТ ✗")
        await page.screenshot(path="/tmp/check-version.png")

        # Фоллбек при блокировке JS-чанков (имитация старого webview/кэша)
        ctx2 = await browser.new_context(viewport={"width": 412, "height": 915})
        await ctx2.add_init_script("window.localStorage.setItem('pr.onboarded','true');")
        page2 = await ctx2.new_page()

        async def block_chunks(route):
            if "/_next/static/chunks/" in route.request.url:
                await route.abort()
            else:
                await route.continue_()
        await page2.route("**/*", block_chunks)
        await page2.goto(BASE + "/", wait_until="commit", timeout=30000)
        await page2.wait_for_timeout(6500)
        boot2 = await page2.evaluate("getComputedStyle(document.getElementById('pr-boot')).display !== 'none'")
        print("7. Fallback при мёртвых чанках:", boot2, "(должно быть True)")
        await page2.screenshot(path="/tmp/check-fallback.png")

        await browser.close()

asyncio.run(run())
