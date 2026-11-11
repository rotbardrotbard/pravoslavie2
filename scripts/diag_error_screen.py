"""Скриншот экрана ошибки + тест кнопки «Очистить данные приложения»"""
import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3111"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2)
        await ctx.add_init_script(
            "window.localStorage.setItem('pr.onboarded','true');"
            "window.localStorage.setItem('pr.userName','\"Иван\"');"
            "window.localStorage.setItem('pr.textScale','115');"
        )
        page = await ctx.new_page()
        await page.goto(BASE + "/test-error", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        txt = (await page.inner_text("body"))[:250].replace("\n", " | ")
        print("Экран ошибки:", txt if txt.strip() else "(пусто)")
        await page.screenshot(path="/tmp/error-screen.png")

        # Кнопка «Очистить данные приложения»
        try:
            await page.get_by_text("Очистить данные приложения").click(timeout=4000)
            await page.wait_for_timeout(3000)
            ls = await page.evaluate("JSON.stringify(Object.keys(localStorage))")
            url = page.url
            txt2 = (await page.inner_text("body"))[:150].replace("\n", " | ")
            print("После очистки: url =", url)
            print("localStorage:", ls)
            print("Страница:", txt2)
            await page.screenshot(path="/tmp/error-after-wipe.png")
        except Exception as e:
            print("Кнопка очистки:", str(e)[:200])
        await browser.close()

asyncio.run(run())
